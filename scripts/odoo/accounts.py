# Set the local Odoo accounts. Re-runnable. Prints no secret.
#   - the admin user's password, from /root/.agents/odoo/admin-password
#   - a dedicated read-only user for the feed exporter ("feed-exporter"), in the
#     Innovation Hub "Feed reader (read only)" group, and an API key for it kept only
#     in /root/.agents/odoo/feed-api-key (mode 600)
#   - the plan broker's user ("plan-broker"), in the Innovation Hub "Plan broker" group (create and
#     update hub records, no delete, no users or rights), and an API key for it kept only in
#     /root/.agents/odoo/plan-broker-api-key (mode 600); used by scripts/odoo/apply-plan.mjs
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

Users = env['res.users'].with_context(active_test=False, no_reset_password=True)
Keys = env['res.users.apikeys']


def ensure_user(login, name, group, label):
    user = Users.search([('login', '=', login)], limit=1)
    vals = {
        'name': name,
        'login': login,
        'group_ids': [(6, 0, [env.ref('base.group_user').id, group.id])],
        'active': True,
    }
    if user:
        user.write(vals)
    else:
        user = Users.create(vals)
    print('%s user: %s (id %s), groups: Internal User + Innovation Hub / %s' % (label, login, user.id, group.name))
    return user


def ensure_key(user, secret_name, key_name, label):
    key_ok = False
    if os.path.exists(os.path.join(SECRETS, secret_name)):
        try:
            key_ok = Keys._check_credentials(scope='rpc', key=read_secret(secret_name)) == user.id
        except Exception:
            key_ok = False
    if key_ok:
        print('%s API key: the stored key is valid, kept' % label)
    else:
        Keys.sudo().search([('user_id', '=', user.id), ('name', '=', key_name)]).unlink()
        key = Keys.with_user(user).sudo()._generate(None, key_name, None)
        write_secret(secret_name, key)
        print('%s API key: created and stored in the secrets folder (mode 600)' % label)


reader_group = env.ref('algarve_innovation_hub.group_aih_reader')
feed_user = ensure_user('feed-exporter', 'Feed exporter (read only)', reader_group, 'feed')
ensure_key(feed_user, 'feed-api-key', 'feed-export', 'feed')

# The plan broker (addon 19.0.1.3.0 and later): writes approved, signed plans to hub models only.
broker_group = env.ref('algarve_innovation_hub.group_aih_broker', raise_if_not_found=False)
if broker_group:
    broker_user = ensure_user('plan-broker', 'Plan broker (hub records, no delete)', broker_group, 'broker')
    ensure_key(broker_user, 'plan-broker-api-key', 'plan-broker', 'broker')
else:
    print('broker user: skipped, the addon has no Plan broker group yet (run setup-local.sh --update)')

env.cr.commit()
