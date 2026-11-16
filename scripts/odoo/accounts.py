# Set the local Odoo accounts. Re-runnable. Prints no secret.
#   - the admin user's password, from /root/.agents/odoo/admin-password
#   - a dedicated read-only user for the feed exporter ("feed-exporter"), in the
#     Innovation Hub "Feed reader (read only)" group, and an API key for it kept only
#     in /root/.agents/odoo/feed-api-key (mode 600)
# Run inside an Odoo shell (scripts/odoo/setup-local.sh does this):
#   AIH_SECRETS=/root/.agents/odoo odoo shell -c <conf> -d algarve_innovation_hub --no-http < scripts/odoo/accounts.py
# Written by odoo@AgentiCCells.dinis. Apache-2.0.
import os

SECRETS = os.environ.get('AIH_SECRETS', '/root/.agents/odoo')


def read_secret(name):
    with open(os.path.join(SECRETS, name), encoding='utf-8') as f:
        return f.read().strip()


def write_secret(name, value):
    path = os.path.join(SECRETS, name)
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w') as f:
        f.write(value + '\n')
    os.chmod(path, 0o600)


admin = env.ref('base.user_admin')
admin.sudo().write({'password': read_secret('admin-password')})
print('admin password: set from the secrets folder')

reader_group = env.ref('algarve_innovation_hub.group_aih_reader')
Users = env['res.users'].with_context(active_test=False, no_reset_password=True)
user = Users.search([('login', '=', 'feed-exporter')], limit=1)
vals = {
    'name': 'Feed exporter (read only)',
    'login': 'feed-exporter',
    'group_ids': [(6, 0, [env.ref('base.group_user').id, reader_group.id])],
    'active': True,
}
if user:
    user.write(vals)
else:
    user = Users.create(vals)
print('feed user: feed-exporter (id %s), groups: Internal User + Innovation Hub / Feed reader (read only)' % user.id)

Keys = env['res.users.apikeys']
key_ok = False
if os.path.exists(os.path.join(SECRETS, 'feed-api-key')):
    try:
        key_ok = Keys._check_credentials(scope='rpc', key=read_secret('feed-api-key')) == user.id
    except Exception:
        key_ok = False
if key_ok:
    print('feed API key: the stored key is valid, kept')
else:
    Keys.sudo().search([('user_id', '=', user.id), ('name', '=', 'feed-export')]).unlink()
    key = Keys.with_user(user).sudo()._generate(None, 'feed-export', None)
    write_secret('feed-api-key', key)
    print('feed API key: created and stored in the secrets folder (mode 600)')

env.cr.commit()
