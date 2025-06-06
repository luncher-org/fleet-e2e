/*
Copyright © 2023 - 2025 SUSE LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import 'cypress/support/commands';
import { qase } from 'cypress-qase-reporter/dist/mocha';

export const appName = "nginx-keep"
export const branch = "master"
export const path = "qa-test-apps/nginx-app"
export const repoUrl = "https://github.com/rancher/fleet-test-data/"
export const dsAllClusterList = ['imported-0', 'imported-1', 'imported-2']
export const dsFirstClusterName = dsAllClusterList[0]

beforeEach(() => {
  cy.login();
  cy.visit('/');
  cy.deleteAllFleetRepos();
});


describe('Test resource behavior after deleting GitRepo using keepResources option using YAML', { tags: '@p1' }, () => {
  qase(68, 
    it('Fleet-68: Test RESOURCES will be KEPT and NOT be DELETED after GitRepo is deleted when keepResources: true used in the GitRepo yaml file.', { tags: '@fleet-68' }, () => {
      cy.accesMenuSelection('Continuous Delivery', 'Git Repos');
      cy.fleetNamespaceToggle('fleet-local')
      cy.clickButton('Add Repository');
      cy.contains('Git Repo:').should('be.visible');
      cy.clickButton('Edit as YAML');
      cy.addYamlFile('assets/git-repo-keep-resources-true.yaml');
      cy.clickButton('Create');
      cy.checkGitRepoStatus('local-cluster-fleet-68', '1 / 1');

      // Check application gets installed on the local cluster.
      cy.checkApplicationStatus(appName);

      // Delete GitRepo
      cy.deleteAllFleetRepos();

      // Check application is present after deleting GitRepo (keepResource option)
      cy.checkApplicationStatus(appName);
      cy.deleteApplicationDeployment();
    })
  )
})

describe('Test resource behavior after deleting GitRepo using keepResources option', { tags: '@p1'}, () => {
  const keepResourceData: testData[] = [
    { qase_id: 69,
      keepResources: 'yes',
      test_explanation: 'RESOURCES will be KEPT and NOT be DELETED after GitRepo is deleted.',
    },
    { qase_id: 70,
      keepResources: 'no',
      test_explanation: 'RESOURCES will NOT be KEPT and  will be DELETED after GitRepo is deleted.',
    },
  ]
  keepResourceData.forEach(
    ({ qase_id, keepResources, test_explanation}) => {
      qase(qase_id,
        it(`Fleet-${qase_id}: Test ${test_explanation}`, { tags: `@fleet-${qase_id}` }, () => {
          const repoName = `local-cluster-fleet-${qase_id}`
          cy.fleetNamespaceToggle('fleet-local')
          cy.addFleetGitRepo({ repoName, repoUrl, branch, path, keepResources });
          cy.clickButton('Create');
          cy.checkGitRepoStatus(repoName, '1 / 1', '1 / 1');
          cy.checkApplicationStatus(appName);
          cy.deleteAllFleetRepos();
          if (keepResources === 'yes') {
            cy.checkApplicationStatus(appName);
            cy.deleteApplicationDeployment();
          }
        })
      )
    }
  )
});

describe('Test Self-Healing of resource modification when correctDrift option used', { tags: '@p1'}, () => {
  const correctDriftData: testData[] = [
    { qase_id: 76,
      correctDrift: 'yes',
      test_explanation: 'MODIFICATION to resources will be self-healed when correctDrift is set to true in GitRepo.',
    },
    { qase_id: 113,
      correctDrift: 'no',
      test_explanation: 'MODIFICATION to resources will not be self-healed when correctDrift is set to false in GitRepo.',
    },
  ]
  correctDriftData.forEach(
    ({ qase_id, correctDrift, test_explanation}) => {
      qase(qase_id,
        it(`Fleet-${qase_id}: Test ${test_explanation}`, { tags: `@fleet-${qase_id}` }, () => {
          const repoName = `local-cluster-correct-${qase_id}`
          cy.fleetNamespaceToggle('fleet-local')
          cy.addFleetGitRepo({ repoName, repoUrl, branch, path, correctDrift });
          cy.clickButton('Create');
          cy.checkGitRepoStatus(repoName, '1 / 1', '1 / 1');
          cy.checkApplicationStatus(appName);

          // Modify deployment count of application
          cy.modifyDeployedApplication(appName);

          if (correctDrift === 'yes') {
            // Resources will be restored, hence count will be 1/1.
            cy.verifyTableRow(0, appName, '1/1');
          } else {
            // Resource count will get increased as resource will not be restored
            cy.verifyTableRow(0, appName, '2/2');
          }
          cy.deleteAllFleetRepos();
        })
      )
    }
  )
});

describe('Test Self-Healing of resource modification when correctDrift option used for exisiting GitRepo', { tags: '@p1'}, () => {
  qase(77,
    it("Fleet-77: Test MODIFICATION to resources will be self-healed when correctDrift is set to true in existing GitRepo.", { tags: '@fleet-77', retries: 1 }, () => {
      const repoName = "local-cluster-correct-77"
      cy.fleetNamespaceToggle('fleet-local')
      cy.addFleetGitRepo({ repoName, repoUrl, branch, path });
      cy.clickButton('Create');
      cy.checkGitRepoStatus(repoName, '1 / 1', '1 / 1');
      cy.checkApplicationStatus(appName);

      // Modify deployment count of application
      cy.modifyDeployedApplication(appName);

      // Resource count will get increased as resource will not be restored
      cy.verifyTableRow(0, appName, '2/2');

      // Update exising GitRepo by enabling 'correctDrift'
      cy.addFleetGitRepo({ repoName, correctDrift: 'yes', editConfig: true });
      cy.clickButton('Save');

      // This test is exception for using 'Force Update'.
      // Wait added to mitigate problems before force ipdate on 2.11 onwards
      // TODO: remove or rework when possible 
      cy.wait(2000);
      cy.open3dotsMenu(repoName, 'Force Update');

      cy.checkGitRepoStatus(repoName, '1 / 1', '1 / 1');
      cy.checkApplicationStatus(appName);

      // Modify deployment count of application
      cy.modifyDeployedApplication(appName);

      // Resources will be restored, hence count will be 1/1.
      cy.verifyTableRow(0, appName, '1/1');

      cy.deleteAllFleetRepos();
    })
  )
});

describe('Test resource behavior after deleting GitRepo using keepResources option for exisiting GitRepo', { tags: '@p1'}, () => {
  qase(71,
    it("Fleet-71: Test RESOURCES will be KEPT and NOT be DELETED after GitRepo is deleted when keepResources is set to true in existing GitRepo.", { tags: '@fleet-71' }, () => {
      const repoName = "local-cluster-keep-71"
      cy.fleetNamespaceToggle('fleet-local')
      cy.addFleetGitRepo({ repoName, repoUrl, branch, path });
      cy.clickButton('Create');
      cy.checkGitRepoStatus(repoName, '1 / 1', '1 / 1');
      cy.checkApplicationStatus(appName);

      // Edit existing GitRepo with 'keepResource: true' to prevent
      // application removal after GitRepo delete.
      cy.addFleetGitRepo({ repoName, keepResources: 'yes', editConfig: true });
      cy.clickButton('Save');
      cy.checkGitRepoStatus(repoName, '1 / 1', '1 / 1');

      // Delete GitRepo to check application removed or not.
      cy.deleteAllFleetRepos();

      // Check application still exists after deleting existing GitRepo
      cy.checkApplicationStatus(appName);
      cy.deleteApplicationDeployment();
    })
  )
});

// Perform this test only if rancher_version does not contain "/2.7"
if (!/\/2\.7/.test(Cypress.env('rancher_version'))) {
  describe('Test local cluster behavior with New workspace', { tags: '@p1'}, () => {
    qase(107,
      it("Fleet-107: Test LOCAL CLUSTER cannot be moved to another workspace as no 'Change workspace' option available..", { tags: '@fleet-107' }, () => {
        cy.accesMenuSelection('Continuous Delivery', 'Clusters');
        cy.fleetNamespaceToggle('fleet-local');
        cy.open3dotsMenu('local', 'Change workspace', true);
      })
    )
  });
}

if (!/\/2\.7/.test(Cypress.env('rancher_version'))) {
  describe('Imagescan tests', { tags: '@p1'}, () => {
    qase(112,
      it("Fleet-112: Test imagescan app without expected semver range does not break fleet controller", { tags: '@fleet-112' }, () => {;
        const repoName = 'local-cluster-imagescan-112'
        const repoUrl = 'https://github.com/rancher/fleet-test-data'
        const branch = 'master'
        const path = 'imagescans'

        cy.fleetNamespaceToggle('fleet-local');
        cy.addFleetGitRepo({ repoName, repoUrl, branch, path });
        cy.clickButton('Create');
        cy.verifyTableRow(0, 'Error', '1/1');
        cy.accesMenuSelection('local', 'Workloads');
        cy.nameSpaceMenuToggle('All Namespaces');
        cy.filterInSearchBox('fleet-controller');
        cy.verifyTableRow(0, 'Running', 'fleet-controller')
        cy.deleteAllFleetRepos();
      })
    )
  });
}

// RepoURLRegex is supported on v2.8 but error reporting is not working correctly there
// Ref. https://github.com/rancher/fleet/issues/2462 but it wont be fixed in v2.8
if (!/\/2\.7/.test(Cypress.env('rancher_version')) && !/\/2\.8/.test(Cypress.env('rancher_version'))) {
  describe('Private Helm Repository tests (helmRepoURLRegex)', { tags: '@p1'}, () => {

    const repoUrl = 'https://github.com/fleetqa/fleet-qa-examples-public.git'
    const branch = 'main'
    const userOrPublicKey = 'user'
    const pwdOrPrivateKey = 'password'
    const gitOrHelmAuth = 'Helm'
    const gitAuthType = "http"
    let helmUrlRegex

    const privateHelmData: testData[] = [
      { qase_id: 64,
        repoName: "local-private-helm-repo-64",
        path: 'helm-urlregex-repo',
        test_explanation: 'repo',
        helmUrlRegex_matching: '^http.*',
      },
      { qase_id: 65,
        repoName: "local-private-helm-chart-65",
        path: 'helm-urlregex-chart',
        test_explanation: 'chart',
        helmUrlRegex_matching: '^http.*app.*tgz$',
      },
    ]

    // Actually just a preparation step
    it("Prepare the private helm registry", { tags: '@preparation' }, () => {
      cy.importYaml({ clusterName: 'local', yamlFilePath: 'assets/helm-server-with-auth-and-data.yaml' });
      cy.nameSpaceMenuToggle('default');
      // The check doesn't wait for Active state, only its presence
      cy.checkApplicationStatus('nginx-helm-repo');
      // We keep the resources in cluster forever
    });

    privateHelmData.forEach(
      ({qase_id, repoName, path, helmUrlRegex_matching, test_explanation}) => {
        qase(qase_id,
          it(`Fleet-${qase_id}: Test private helm registries for \"helmRepoURLRegex\" matches with \"${test_explanation}\" URL specified in fleet.yaml file`, { tags: `@fleet-${qase_id}` }, () => {;
            // Positive test using matching regex
            helmUrlRegex = helmUrlRegex_matching
            cy.fleetNamespaceToggle('fleet-local');
            cy.addFleetGitRepo({ repoName, repoUrl, branch, path, gitOrHelmAuth, gitAuthType, userOrPublicKey, pwdOrPrivateKey, helmUrlRegex });
            cy.clickButton('Create');
            cy.verifyTableRow(0, 'Active', /([1-9]\d*)\/\1/);
            cy.accesMenuSelection('local', 'Storage', 'ConfigMaps');
            cy.nameSpaceMenuToggle('All Namespaces');
            cy.filterInSearchBox('local-chart-configmap');
            cy.wait(2000);
            cy.get('.col-link-detail').contains('local-chart-configmap').should('be.visible').click({ force: true });
            cy.get('section#data').should('contain', 'sample-cm').and('contain', 'sample-data-inside');
            cy.deleteAllFleetRepos();
            // Negative test using non-matching regex 1234.*
            helmUrlRegex = '1234.*'
            cy.fleetNamespaceToggle('fleet-local');
            cy.addFleetGitRepo({ repoName, repoUrl, branch, path, gitOrHelmAuth, gitAuthType, userOrPublicKey, pwdOrPrivateKey, helmUrlRegex });
            cy.clickButton('Create');
            cy.get('.text-error', { timeout: 120000 }).should('contain', 'code: 401');
            cy.deleteAllFleetRepos();
          })
        )
      })
  });
}

  describe('Test OCI support', { tags: '@p1'}, () => {
    qase(60,
      it("Fleet-60: Test OCI helm chart support on Github Container Registry", { tags: '@fleet-60' }, () => {;
        const repoName = 'default-oci-60'
        const repoUrl = 'https://github.com/rancher/fleet-test-data'
        const branch = 'master'
        const path = 'helm-oci'

        cy.fleetNamespaceToggle('fleet-default');
        cy.addFleetGitRepo({ repoName, repoUrl, branch, path });
        cy.clickButton('Create');
        cy.verifyTableRow(0, 'Active', /([1-9]\d*)\/\1/);
        cy.accesMenuSelection(dsFirstClusterName, 'Storage', 'ConfigMaps');
        cy.nameSpaceMenuToggle('All Namespaces');
        cy.filterInSearchBox('fleet-test-configmap');
        cy.get('.col-link-detail').contains('fleet-test-configmap').should('be.visible').click({ force: true });
        cy.get('section#data').should('contain', 'default-name').and('contain', 'value');
        cy.deleteAllFleetRepos();
      })
    )
  
    qase(127,
      it("Fleet-127: Test PRIVATE OCI helm chart support on Github Container Registry", { tags: '@fleet-127' }, () => {;
        const repoName = 'default-oci-127'
        const repoUrl = 'https://github.com/fleetqa/fleet-qa-examples-public'
        const branch = 'main'
        const path = 'helm-oci-auth'
        const gitOrHelmAuth = 'Helm'
        const gitAuthType = "http"
        const userOrPublicKey = Cypress.env("gh_private_user")
        const pwdOrPrivateKey = Cypress.env("gh_private_pwd")
    
        cy.fleetNamespaceToggle('fleet-default');
        cy.addFleetGitRepo({ repoName, repoUrl, branch, path, gitOrHelmAuth, gitAuthType, userOrPublicKey, pwdOrPrivateKey});
        cy.clickButton('Create');
        cy.verifyTableRow(0, 'Active', /([1-9]\d*)\/\1/);
        cy.accesMenuSelection(dsFirstClusterName, 'Storage', 'ConfigMaps');
        cy.nameSpaceMenuToggle('All Namespaces');
        cy.filterInSearchBox('fleet-test-configmap');
        cy.get('.col-link-detail').contains('fleet-test-configmap').should('be.visible').click({ force: true });
        cy.get('section#data').should('contain', 'default-name').and('contain', 'value');
        cy.deleteAllFleetRepos();
      })
    )  
  });

// Error will occur when use ForceUpdate.
// In 2.9 we are skipping due flakiness in the test.
if (!/\/2\.9/.test(Cypress.env('rancher_version'))) {
  describe('Test Self-Healing on IMMUTABLE resources when correctDrift is enabled', { tags: '@p1'}, () => {
    const correctDriftTestData: testData[] = [
      { qase_id: 80,
        repoName: "ds-cluster-correct-80",
        resourceType: "ConfigMaps",
        resourceName: "mp-app-config",
        resourceLocation: "Storage",
        resourceNamespace: "test-fleet-mp-config",
        dataToAssert: "test, test_key",
      },
      { qase_id: 79,
        repoName: "ds-cluster-correct-79",
        resourceType: "Services",
        resourceName: "mp-app-service",
        resourceLocation: "Service Discovery",
        resourceNamespace: "test-fleet-mp-service",
        dataToAssert: "6341 ",
      },
    ]
  
    correctDriftTestData.forEach(
      ({qase_id, repoName, resourceType, resourceName, resourceLocation, resourceNamespace, dataToAssert}) => {
        qase(qase_id,
          it(`Fleet-${qase_id}: Test IMMUTABLE resource "${resourceType}" will NOT be self-healed when correctDrift is set to true.`, { tags: `@fleet-${qase_id}` }, () => {
            const path = "multiple-paths"
  
            // Add GitRepo by enabling 'correctDrift'
            cy.fleetNamespaceToggle('fleet-default')
            cy.addFleetGitRepo({ repoName, repoUrl, branch, path, correctDrift: 'yes' });
            cy.clickButton('Create');
            cy.checkGitRepoStatus(repoName, '2 / 2');
            cy.accesMenuSelection(dsFirstClusterName, resourceLocation, resourceType);
            cy.nameSpaceMenuToggle(resourceNamespace);
            cy.filterInSearchBox(resourceName);
            cy.get('.col-link-detail').contains(resourceName).should('be.visible');
            cy.verifyTableRow(0, resourceName);
            cy.open3dotsMenu(resourceName, 'Edit Config');
  
            if (resourceType === 'ConfigMaps') {
              cy.clickButton('Add');
              cy.get('[data-testid="input-kv-item-key-1"]').eq(0).focus().type('test_key');
              cy.get('div.code-mirror.as-text-area').eq(1).click().type("test_data_value");
              cy.clickButton('Add');
            }
            else if (resourceType === 'Services') {
              cy.get("input[type=number]").clear().type("6341");
            }
  
            else  {
              throw new Error(`Resource "${resourceType}" is invalid  / not implemented yet`);
            }

            cy.wait(500);
            cy.clickButton('Save');
            cy.filterInSearchBox(resourceName);
            cy.verifyTableRow(0, resourceName, dataToAssert);

            // Adding more wait for 30seconds to capture the error if occurred after modifying the resources.
            cy.wait(30000);
            cy.accesMenuSelection('Continuous Delivery', 'Git Repos');
            cy.verifyTableRow(0, 'Active', repoName);

            // Check All clusters are in healthy state after performing any modification to the resources.
            dsAllClusterList.forEach((dsCluster) => {
              // Adding wait to load page correctly to avoid interference with hamburger-menu.
              cy.wait(500);
              cy.accesMenuSelection('Continuous Delivery', 'Clusters');
              cy.contains('.title', 'Clusters').should('be.visible');
              cy.filterInSearchBox(dsCluster);
              cy.verifyTableRow(0, 'Active', dsCluster);
            })

            // Any mutable resource will reconcile to it's original state immediately
            // But with ConfigMaps and Services, it is not because they are immutable i.e.
            // they didn't reconciled when `correctDrift` is enabled.
            cy.deleteAllFleetRepos();

            // Delete leftover resources if there are any on each downstream cluster.
            // Currently, service is getting deleted from cluster, hence adding check for it.
            dsAllClusterList.forEach((dsCluster) => {
              // Adding wait to load page correctly to avoid interference with hamburger-menu.
              cy.wait(500);
              cy.accesMenuSelection(dsCluster, "Service Discovery", "Services");
              cy.nameSpaceMenuToggle(resourceNamespace);
              cy.filterInSearchBox(resourceName);
              cy.deleteAll(false);
              cy.clickNavMenu(['Cluster', 'Projects/Namespaces']);
              cy.filterInSearchBox(resourceNamespace);
              cy.deleteAll(false);
            })
          })
        )
      }
    )
  });
}

if (!/\/2\.7/.test(Cypress.env('rancher_version')) && !/\/2\.8/.test(Cypress.env('rancher_version'))) {

  describe('Tests with disablePolling', { tags: '@p1' }, () => {
  
    const gh_private_pwd = Cypress.env('gh_private_pwd');
    const repoName = 'test-disable-polling';

    // Function to prepare Github repo used in the test
    // It will make sure it starts with 2 replicas and changes it to 5
    // We use this instead of hook to make it more resilient
    function prepareGithubRepoReplicas() {

      // Ensuring Github repo has desired amount of replicas (2)
      cy.exec('bash assets/disable_polling_reset_2_replicas.sh', { env: { gh_private_pwd } }).then((result) => {
        cy.log(result.stdout, result.stderr);
      });

      cy.fleetNamespaceToggle('fleet-local');
      cy.clickButton('Add Repository');

      // Pass YAML file (no previous additions of Name, urls or paths)
      cy.clickButton('Edit as YAML');
      cy.addYamlFile('assets/disable_polling.yaml');
      cy.clickButton('Create');
      cy.checkGitRepoStatus('test-disable-polling', '1 / 1', '1 / 1');

      // Change replicas to 5
      cy.exec('bash assets/disable_polling_setting_5_replicas.sh').then((result) => {
        cy.log(result.stdout, result.stderr);
      });
    }
    
    if (!/\/2\.9/.test(Cypress.env('rancher_version'))) { 
    // Skipping in 2.9 due to https://github.com/rancher/fleet/issues/3048
    qase(126,
      it(
        'Fleet-126: Test when `disablePolling=true` and forcing update Gitrepo will sync latest changes from Github',
        { tags: '@fleet-126', retries: 1 }, // TODO: Retry added to avoid intermittent failures. Remove once fixed.
        () => {

          prepareGithubRepoReplicas()
          
          // Forcing 15 seconds of wait to check if changes occur after this time.
          cy.wait(15000);

          // Verify deployment is 2 despite having changed to 5 in original repo
          cy.accesMenuSelection('local', 'Workloads', 'Deployments');
          cy.filterInSearchBox('nginx-test-polling');
          cy.wait(500);

          cy.log('HERE WE SHOULD SEE 2/2');
          cy.contains('tr.main-row', 'nginx-test-polling', { timeout: 20000 }).should('be.visible');
          cy.screenshot('Screenshot BEFORE reloading should be 2/2');
          cy.contains('tr.main-row', 'nginx-test-polling', { timeout: 20000 }).should('be.visible');
          cy.screenshot('Screenshot AFTER reloading should be 2/2');
          cy.verifyTableRow(0, 'Active', '2/2');

          cy.accesMenuSelection('Continuous Delivery', 'Git Repos');
          cy.fleetNamespaceToggle('fleet-local');
          cy.open3dotsMenu('test-disable-polling', 'Force Update');
          cy.wait(2000); // Wait to let time for Update to take effect.
          cy.checkGitRepoStatus('test-disable-polling', '1 / 1', '1 / 1');

          // Verify deployment changes to 5
          cy.accesMenuSelection('local', 'Workloads', 'Deployments');
          cy.filterInSearchBox('nginx-test-polling');
          cy.verifyTableRow(0, 'Active', '5/5');
        }
      )
    )};

    qase(124,
      it(
        'Fleet-124: Test when `disablePolling=true` Gitrepo will not sync latest changes from Github',
        { tags: '@fleet-124' },
        () => {

          prepareGithubRepoReplicas()

          // Forcing 15 seconds of wait to check if changes occur after this time.
          cy.wait(15000);

          // Verify deployment is 2 despite having changed to 5 in original repo
          cy.accesMenuSelection('local', 'Workloads', 'Deployments');
          cy.filterInSearchBox('nginx-test-polling');
          cy.verifyTableRow(0, 'Active', '2/2');
        }
      )
    );

    qase(125,
      it(
        'Fleet-125: Test when `disablePolling=true` and pausing / unpausing Gitrepo will sync latest changes from Github',
        { tags: '@fleet-125' },
        () => {

          prepareGithubRepoReplicas()

          cy.accesMenuSelection('Continuous Delivery', 'Git Repos');
          cy.fleetNamespaceToggle('fleet-local');
          cy.open3dotsMenu(repoName, 'Pause');

          cy.verifyTableRow(0, 'Paused');
          cy.wait(2000); // Wait to let time for pause to take effect.
          cy.open3dotsMenu(repoName, 'Unpause');

          cy.verifyTableRow(0, 'Active');
          // Verify deployment changes to 5?
          cy.accesMenuSelection('local', 'Workloads', 'Deployments');
          cy.filterInSearchBox('nginx-test-polling');
          cy.verifyTableRow(0, 'Active', '5/5');
        }
      )
    );
  });
}
