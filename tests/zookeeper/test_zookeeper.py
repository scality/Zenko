from utils import ansible_helper


class TestZookeeperCluster:

    def zookeeper_group(self, run_vars):
        zookeeper_hosts = set(run_vars['groups']['app_zenko-zookeeper'])
        test_host = set(run_vars['groups']['zenko-test'])
        return zookeeper_hosts.intersection(test_host)

    def test_different_id(self):
        a_run = ansible_helper.AnsibleHelper(
            'playbooks/kube_inventory.py'
        ).run_playbook('playbooks/zookeeper.yml')
        zookeeper_hosts = self.zookeeper_group(a_run['vars'])
        hostvars = a_run['vars']['hostvars']
        zookeeper_id_dict = {}
        for zoo_host in zookeeper_hosts:
            zookeeper_id_dict[zoo_host] = int(
                hostvars[zoo_host]['zookeeper_id']['stdout'].strip()
            )
        assert set(zookeeper_id_dict.values()) == set(range(1, len(zookeeper_hosts) + 1))
        assert zookeeper_hosts
