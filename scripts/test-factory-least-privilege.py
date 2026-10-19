#!/usr/bin/env python3
"""Exercise adopter workflow authorization without tokens, GitHub or Slack calls."""
import ast
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT / '.github/workflows'
REPORTS = ['factory-hosted-digest', 'factory-hosted-feedback',
           'factory-reporting-alerts', 'factory-reporting-queue']


def read_workflow(name):
    return (WORKFLOWS / (name + '.yml')).read_text()


def block(text, name):
    match = re.search(r'^      - name: ' + re.escape(name) + r'\n(.*?)(?=^      - |\Z)', text, re.M | re.S)
    if not match:
        raise AssertionError('Missing maintained workflow step: ' + name)
    return match[1]


def run_script(step):
    match = re.search(r'^        run: \|\n((?:          .*\n|\n)+)', step, re.M)
    if not match:
        raise AssertionError('Missing literal run block')
    return ''.join(line[10:] if line.startswith('          ') else line for line in match[1].splitlines(True))


def python_script(step):
    shell = run_script(step)
    match = re.search(r"python3 - <<'([A-Z_]+)'\n(.*?)^\1$", shell, re.M | re.S)
    if not match:
        raise AssertionError('Missing maintained inline Python')
    return match[2]


def expression(value, context):
    value = value.strip()
    if not value.startswith('${{') and '==' not in value:
        return value
    value = value.removeprefix('${{').removesuffix('}}').strip()
    for key in sorted(context, key=len, reverse=True):
        value = value.replace(key, repr(context[key]))
    value = re.sub(r'\bvars\.[A-Z_]+', "''", value)
    value = re.sub(r'!(?!=)', 'not ', value).replace('&&', ' and ').replace('||', ' or ')
    tree = ast.parse(value.strip(), mode='eval')
    allowed = (ast.Expression, ast.Constant, ast.BoolOp, ast.And, ast.Or, ast.UnaryOp,
               ast.Not, ast.Compare, ast.Eq, ast.NotEq, ast.Call, ast.Name, ast.Load)
    if any(not isinstance(node, allowed) for node in ast.walk(tree)):
        raise AssertionError('Unsupported expression; review test evaluator')
    if any(isinstance(node, ast.Name) and node.id != 'format' for node in ast.walk(tree)):
        raise AssertionError('Unexpected expression variable')
    return interpret(tree.body)


def interpret(node):
    if isinstance(node, ast.Constant):
        return node.value
    if isinstance(node, ast.UnaryOp):
        return not interpret(node.operand)
    if isinstance(node, ast.BoolOp):
        for child in node.values:
            value = interpret(child)
            if isinstance(node.op, ast.And) and not value:
                return value
            if isinstance(node.op, ast.Or) and value:
                return value
        return value
    if isinstance(node, ast.Compare):
        left = interpret(node.left)
        for operator, child in zip(node.ops, node.comparators):
            right = interpret(child)
            if (left == right) != isinstance(operator, ast.Eq):
                return False
            left = right
        return True
    if isinstance(node, ast.Call) and node.func.id == 'format' and len(node.args) == 2:
        return interpret(node.args[0]).format(interpret(node.args[1]))
    raise AssertionError('Unsupported expression node')


def reporting_condition(text):
    match = re.search(r'^    if: >-\n((?:      .*\n)+)', text, re.M)
    if not match:
        raise AssertionError('Missing maintained job condition')
    return ' '.join(line.strip() for line in match[1].splitlines())


def reporting_context():
    keys = ['FACTORY_REPORTING_ENABLED', 'FACTORY_FEEDBACK_ENABLED',
            'FACTORY_REPORTING_APP_WRITER_ENABLED', 'FACTORY_REPORTING_QUEUE_ENABLED',
            'FACTORY_REPORTING_MONITOR_ENABLED']
    return {**{'vars.' + k: 'true' for k in keys},
            'vars.FACTORY_REPORTING_PROFILE': 'github-hosted',
            'github.ref': 'refs/heads/main', 'github.server_url': 'https://github.com',
            'github.event.repository.default_branch': 'main'}


class ReportingAuthorization(unittest.TestCase):
    def test_writer_disabled_or_absent_never_allocates_reporting_job(self):
        for name in REPORTS:
            condition = reporting_condition(read_workflow(name))
            context = reporting_context()
            self.assertTrue(expression(condition, context), name + ' intended route unavailable')
            for value in ('false', ''):
                with self.subTest(workflow=name, writer=value):
                    context['vars.FACTORY_REPORTING_APP_WRITER_ENABLED'] = value
                    self.assertFalse(expression(condition, context), 'writer-disabled job can expose reporting environment')

    def test_ordinary_token_is_read_and_no_legacy_secret_is_exposed(self):
        for name in REPORTS:
            with self.subTest(workflow=name):
                text = read_workflow(name)
                permissions = re.search(r'^permissions:\n((?:  .*\n)+)', text, re.M)[1]
                self.assertRegex(permissions, r'(?m)^  contents: read$')
                self.assertNotIn('FACTORY_REPORTING_STATE_TOKEN', text)
                mint = block(text, 'Mint repository-scoped reporting writer token')
                self.assertIn('permission-contents: write', mint)
                self.assertIn('permission-administration: read', mint)
                self.assertIn('repositories: ${{ github.event.repository.name }}', mint)

    def test_runtime_rejects_env_override_before_any_client_or_slack(self):
        for name in REPORTS:
            text = read_workflow(name)
            selected = block(text, 'Validate selected reporting credentials')
            self.assertNotRegex(selected, r'(?m)^        if:', 'runtime App-only rejection must not be skipped by an environment override')
            code = python_script(selected)
            for enabled, app_token, expected in [('true', 'writer-synthetic', 0),
                                                   ('false', 'writer-synthetic', 1),
                                                   ('', 'writer-synthetic', 1),
                                                   ('true', '', 1)]:
                with self.subTest(workflow=name, enabled=enabled, app_token=bool(app_token)):
                    env = {'PATH': os.environ['PATH'], 'GITHUB_REPOSITORY': 'org/repo',
                           'FACTORY_REPORTING_STATE_REPOSITORY': 'org/repo',
                           'FACTORY_REPORTING_APP_WRITER_ENABLED': enabled,
                           'FACTORY_REPORTING_APP_ID': '5340785', 'GH_TOKEN': 'source-synthetic',
                           'FACTORY_REPORTING_APP_TOKEN': app_token,
                           'FACTORY_REPORTING_STATE_TOKEN': 'legacy-synthetic'}
                    result = subprocess.run(['python3', '-'], input=code, cwd=ROOT, env=env,
                                            capture_output=True, text=True, timeout=15)
                    self.assertEqual(result.returncode == 0, expected == 0, result.stderr)

    def test_real_transport_routes_state_only_to_app_and_never_falls_back(self):
        path = ROOT / '.claude/scripts/factory-reporting-transport.py'
        spec = importlib.util.spec_from_file_location('adopter_transport', path)
        transport = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(transport)
        env = {'GITHUB_REPOSITORY': 'org/repo', 'FACTORY_REPORTING_STATE_REPOSITORY': 'org/repo',
               'FACTORY_REPORTING_APP_WRITER_ENABLED': 'true', 'FACTORY_REPORTING_APP_ID': '5340785',
               'GH_TOKEN': 'source-synthetic', 'FACTORY_REPORTING_APP_TOKEN': 'writer-synthetic',
               'FACTORY_REPORTING_STATE_TOKEN': 'legacy-synthetic'}
        calls = []
        def observe(argv, **kwargs):
            calls.append((argv, kwargs['env']['GH_TOKEN']))
            return subprocess.CompletedProcess(argv, 0, b'{}', b'')
        with patch.object(transport.process, 'run', side_effect=observe):
            api = transport.create_api(env)
            api.request('repos/org/repo/actions/runs/7')
            api.request('repos/org/repo/git/refs/heads/factory-reporting-state', 'PATCH', {'sha': 'a' * 40, 'force': False})
            self.assertEqual([x[1] for x in calls], ['source-synthetic', 'writer-synthetic'])
            with self.assertRaises(ValueError):
                api.request('repos/other/repo/git/refs/heads/state', 'PATCH', {'sha': 'a' * 40, 'force': False})
            with self.assertRaises(ValueError):
                transport.create_api({**env, 'FACTORY_REPORTING_APP_TOKEN': ''})
            self.assertEqual(len(calls), 2)


class ShadowAuthorization(unittest.TestCase):
    def request(self, mode, merge_enabled, *, event='workflow_dispatch'):
        text = read_workflow('factory-merge')
        code = python_script(block(text, 'Resolve request from dispatch or completed candidate run'))
        with tempfile.TemporaryDirectory(prefix='adopter-mode-test-') as folder:
            root = Path(folder);(root / 'factory').mkdir()
            (root / 'factory/policy.json').write_text(json.dumps({'merge_enabled': merge_enabled}))
            data = {'workflow_run': {'event': 'pull_request', 'pull_requests': [{'number': 7}]}} if event == 'workflow_run' else {}
            (root / 'event.json').write_text(json.dumps(data))
            env = {'PATH': os.environ['PATH'], 'GITHUB_EVENT_PATH': str(root / 'event.json'),
                   'GITHUB_OUTPUT': str(root / 'output'), 'GITHUB_EVENT_NAME': event,
                   'REQUEST_PR': '7', 'REQUEST_MODE': mode}
            result = subprocess.run(['python3', '-'], input=code, cwd=root, env=env,
                                    capture_output=True, text=True, timeout=15)
            output = (root / 'output').read_text() if (root / 'output').exists() else ''
            return result, dict(line.split('=', 1) for line in output.splitlines())

    def permissions(self, mode):
        step = block(read_workflow('factory-merge'), 'Mint repository-scoped factory token')
        values = dict(re.findall(r'^          permission-([a-z-]+): (.+)$', step, re.M))
        return {key: expression(value, {'steps.request.outputs.mode': mode}) for key, value in values.items()}

    def test_shadow_keeps_checks_write_but_cannot_request_content_or_pr_write(self):
        for enabled in (False, True):
            with self.subTest(merge_enabled=enabled):
                result, output = self.request('shadow', enabled)
                self.assertEqual(result.returncode, 0, result.stderr)
                selected = self.permissions(output['mode'])
                self.assertEqual(selected['contents'], 'read')
                self.assertEqual(selected['pull-requests'], 'read')
                self.assertEqual(selected['checks'], 'write')
                self.assertEqual(selected['administration'], 'read')
                self.assertEqual(selected['actions'], 'read')

    def test_forbidden_merge_is_rejected_before_permission_outputs_exist(self):
        result, output = self.request('merge', False)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(output, {}, 'forbidden merge reached token-mint inputs')

    def test_permitted_merge_and_workflow_completion_keep_existing_modes(self):
        for event, mode, enabled, expected in [('workflow_dispatch', 'merge', True, 'merge'),
                                               ('workflow_run', '', False, 'shadow'),
                                               ('workflow_run', '', True, 'merge')]:
            with self.subTest(event=event, mode=mode, policy=enabled):
                result, output = self.request(mode, enabled, event=event)
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(output, {'pr': '7', 'mode': expected})
                self.assertEqual(self.permissions(output['mode'])['contents'], 'write' if expected == 'merge' else 'read')

    def test_policy_preflight_and_validated_request_precede_token_mint(self):
        text = read_workflow('factory-merge')
        preflight = text.index('- name: Activation preflight')
        request = text.index('- name: Resolve request from dispatch or completed candidate run')
        mint = text.index('- name: Mint repository-scoped factory token')
        evaluate = text.index('- name: Evaluate authenticated candidate and optionally merge')
        self.assertLess(preflight, request)
        self.assertLess(request, mint)
        self.assertLess(mint, evaluate)
        policy = json.loads((ROOT / 'factory/policy.json').read_text())
        self.assertIs(policy['enabled'], False)
        self.assertIs(policy['merge_enabled'], False)
        self.assertEqual(policy['specs'], {})

    def test_missing_or_unknown_mode_fails_without_mint_outputs(self):
        for mode in ('', 'Merge', 'anything'):
            result, output = self.request(mode, True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(output, {})


if __name__ == '__main__':
    unittest.main(verbosity=2)
