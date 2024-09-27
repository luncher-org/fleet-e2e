/*
Copyright © 2023 - 2024 SUSE LLC

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

export const appName = "nginx-keep";
export const clusterName = "imported-0";
export const branch = "main";
export const path  = "nginx"

beforeEach(() => {
  cy.login();
  cy.visit('/');
  cy.accesMenuSelection('Continuous Delivery', 'Git Repos');
  // cy.deleteAllFleetRepos();
});


Cypress.config();
describe('Test Fleet deployment on PUBLIC repos',  { tags: '@p0' }, () => {
  qase(62,
    it('FLEET-62: Deploy application to local cluster', { tags: '@fleet-62' }, () => {

      const repoName = "local-cluster-fleet-62"
      const branch = "master"
      const path = "simple"
      const repoUrl = "https://github.com/rancher/fleet-examples"

      cy.fleetNamespaceToggle('fleet-local');
      cy.addFleetGitRepo({ repoName, repoUrl, branch, path });
      // Adding check validate "Edit as Yaml" works
      cy.clickButton('Edit as YAML');
      cy.contains('apiVersion: fleet.cattle.io/v1alpha1').should('be.visible');
      cy.clickButton('Create')
      cy.checkGitRepoStatus(repoName, '1 / 1', '6 / 6');
      cy.verifyTableRow(1, 'Service', 'frontend');
      cy.verifyTableRow(3, 'Service', 'redis-master');
      cy.verifyTableRow(5, 'Service', 'redis-slave');
      cy.deleteAllFleetRepos();
    })
  );
});


  it('FLEET-: Test multiple repos NGINX', { tags: '@fleet-multiple' }, () => {

    const testNumber = Array.from({ length: 70 }, (v, k) => k + 60)
    const branch = "master"
    const repoUrl = "https://github.com/mmartin24/test-fleet"

    cy.fleetNamespaceToggle('fleet-default');

    testNumber.forEach(testNumber => {

      const repoName = `default-cluster-fleet-${testNumber}`
      const path = `multiple-gitrepos/gitrepo-${testNumber}`

      cy.addFleetGitRepo({ repoName, repoUrl, branch, path });
      
      cy.clickButton('Create')
      // cy.get('tr.main-row').last().should('contain.text', repoName).and('contain.text', 'Active');
    })
  })

  it('FLEET-: Test multiple bad-path NGINX', { tags: '@fleet-multiple' }, () => {

    const testNumber = Array.from({ length: 30 }, (v, k) => k + 1)
    const branch = "master"
    const repoUrl = "https://github.com/mmartin24/test-fleet"

    cy.fleetNamespaceToggle('fleet-default');

    testNumber.forEach(testNumber => {

      const repoName = `default-bad-path-${testNumber}`
      const path = `bad-path/gitrepo-${testNumber}/bad-path`

      cy.addFleetGitRepo({ repoName, repoUrl, branch, path });
      
      cy.clickButton('Create')
      // cy.get('tr.main-row').last().should('contain.text', repoName).and('contain.text', 'Active');
    })
  })

  it('FLEET-: Test multiple bad-images NGINX', { tags: '@fleet-multiple' }, () => {

    const testNumber = Array.from({ length: 30 }, (v, k) => k + 1)
    const branch = "master"
    const repoUrl = "https://github.com/mmartin24/test-fleet"

    cy.fleetNamespaceToggle('fleet-default');

    testNumber.forEach(testNumber => {

      const repoName = `default-bad-image-${testNumber}`
      const path = `bad-image/gitrepo-${testNumber}`

      cy.addFleetGitRepo({ repoName, repoUrl, branch, path });
      
      cy.clickButton('Create')
      // cy.get('tr.main-row').last().should('contain.text', repoName).and('contain.text', 'Active');
    })
  })

  it.only('FLEET-: Test multiple gitrepo REDS', { tags: '@fleet-multiple' }, () => {

    const testNumber = Array.from({ length: 50 }, (v, k) => k + 1)
    const branch = "master"
    const repoUrl = "https://github.com/mmartin24/test-fleet"

    cy.fleetNamespaceToggle('fleet-default');

    testNumber.forEach(testNumber => {

      const repoName = `default-redis-multiple-resources-${testNumber}`
      const path = `multiple-resources-redis/gitrepo-${testNumber}`

      cy.addFleetGitRepo({ repoName, repoUrl, branch, path });
      cy.clickButton('Create')
      // cy.get('tr.main-row').last().should('contain.text', repoName).and('contain.text', 'Active');
    })
  })


describe('Test Fleet deployment on PRIVATE repos with HTTP auth', { tags: '@p0' }, () => {

  const gitAuthType = "http"
  const repoTestData: testData[] = [
    {qase_id: 6, provider: 'GitLab',  repoUrl: 'https://gitlab.com/fleetqa/fleet-qa-examples.git'},
    {qase_id: 7, provider: 'Gh',  repoUrl: 'https://github.com/fleetqa/fleet-qa-examples.git'},
    {qase_id: 8, provider: 'Bitbucket', repoUrl: 'https://bitbucket.org/fleetqa-bb/fleet-qa-examples.git'},
    {qase_id: 98, provider: 'Azure',  repoUrl: 'https://dev.azure.com/fleetqateam/fleet-qa-examples/_git/fleet-qa-examples'}
  ]

  repoTestData.forEach(({ qase_id, provider, repoUrl }) => {
    qase(qase_id,
      it(`FLEET-${qase_id}: Test to install "NGINX" app using "HTTP" auth on "${provider}" PRIVATE repository`, { tags: `@fleet-${qase_id}`, retries: 1 }, () => {

        const repoName = `default-cluster-fleet-${qase_id}`
        const userOrPublicKey = Cypress.env(`${provider.toLowerCase()}_private_user`)
        const pwdOrPrivateKey = Cypress.env(`${provider.toLowerCase()}_private_pwd`)

        cy.fleetNamespaceToggle('fleet-default')
        cy.addFleetGitRepo({ repoName, repoUrl, branch, path, gitAuthType, userOrPublicKey, pwdOrPrivateKey });
        cy.clickButton('Create');
        cy.checkGitRepoStatus(repoName, '1 / 1');
        cy.checkApplicationStatus(appName, clusterName);
        cy.deleteAllFleetRepos();
      })
    );
  });
});

describe('Test Fleet deployment on PRIVATE repos with SSH auth', { tags: '@p0' }, () => {
  
  const gitAuthType = "ssh"
  const userOrPublicKey = Cypress.env("rsa_public_key_qa")
  const pwdOrPrivateKey = Cypress.env("rsa_private_key_qa")
  const repoTestData: testData[] = [
    {qase_id: 2, provider: 'GitLab', repoUrl: 'git@gitlab.com:fleetqa/fleet-qa-examples.git'},
    {qase_id: 3, provider: 'Bitbucket', repoUrl: 'git@bitbucket.org:fleetqa-bb/fleet-qa-examples.git'},
    {qase_id: 4, provider: 'Github', repoUrl: 'git@github.com:fleetqa/fleet-qa-examples.git'},
    {qase_id: 97, provider: 'Azure', repoUrl: 'git@ssh.dev.azure.com:v3/fleetqateam/fleet-qa-examples/fleet-qa-examples'}
  ]
  
  repoTestData.forEach(({ qase_id, provider, repoUrl }) => {
    qase(qase_id,
      it(`FLEET-${qase_id}: Test to install "NGINX" app using "SSH" auth on "${provider}" PRIVATE repository`, { tags: `@fleet-${qase_id}`, retries: 1 }, () => {
        
        const repoName = `default-cluster-fleet-${qase_id}`

        cy.fleetNamespaceToggle('fleet-default')
        cy.addFleetGitRepo({ repoName, repoUrl, branch, path, gitAuthType, userOrPublicKey, pwdOrPrivateKey });
        cy.clickButton('Create');
        cy.checkGitRepoStatus(repoName, '1 / 1');
        cy.checkApplicationStatus(appName, clusterName);
        cy.deleteAllFleetRepos();
      })
    );
  });
});

describe('Test Fleet deployment on PRIVATE repos using KNOWN HOSTS', { tags: '@p0' }, () => {
  const repoUrl = 'git@github.com:fleetqa/fleet-qa-examples.git';
  const secretKnownHostsKeys = ['assets/known-host.yaml', 'assets/known-host-missmatch.yaml'];

  before('Preparing known hosts secrets via UI', () => {
    // Create known hosts from yaml file
    cy.exec(`bash assets/add-known-host.sh`).then((result) => {
      cy.log(result.stdout, result.stderr);
    });

    // Create secret via UI
    cy.login();
    cy.accesMenuSelection('local', 'Storage', 'Secrets');

    // Creating both known host keys in one loop
    secretKnownHostsKeys.forEach((secretKnownHostsKeys) => {
      cy.clickButton('Create');
      cy.contains('Public key and private key for SSH').should('be.visible').click();
      cy.clickButton('Edit as YAML');
      cy.addYamlFile(secretKnownHostsKeys);
      cy.clickButton('Create');
    });
  });

  qase(141,
    it('FLEET-141  Test to install "NGINX" app using "KNOWN HOSTS" auth on PRIVATE repository', { tags: '@fleet-141' }, () => {
      const repoName = 'local-cluster-fleet-141';
      const gitAuthType = 'ssh-key-knownhost';

      // Create private repo using known host
      cy.fleetNamespaceToggle('fleet-local');
      cy.addFleetGitRepo({ repoName, repoUrl, gitAuthType, branch, path });
      cy.clickButton('Create');
      cy.checkGitRepoStatus(repoName, '1 / 1');
    })
  );

  qase(143,
    it('FLEET-143  Test apps cannot be installed when using missmatched "KNOWN HOSTS" auth on PRIVATE repository',
      { tags: '@fleet-143' }, () => {
        // const repoName = 'local-cluster-fleet-143';
        const repoName = 'known-host-missmatch-1';
        const gitAuthType = 'ssh-key-knownhost-missmatch';

        // Create private repo using known host
        cy.fleetNamespaceToggle('fleet-local');
        cy.addFleetGitRepo({ repoName, repoUrl, gitAuthType, branch, path });
        cy.clickButton('Create');

        // Enrure that apps cannot be installed && error appears
        cy.verifyTableRow(0, /Error|Git Updating/, '0/0');
        cy.contains('Ssh: handshake failed: knownhosts: key mismatch').should('be.visible');
    })
  );
});

describe('Test gitrepos with cabundle', { tags: '@p0' }, () => {
  qase(142,
    it("Fleet-142: Test Fleet can create cabundle secrets", { tags: '@fleet-142' }, () => {;
      
      const repoName = 'local-142-test-bundle-secrets'
      const repoUrl = 'https://github.com/rancher/fleet-examples'
      const branch = 'master'
      const path = 'simple'
      const tlsOption = "Specify additional certificates to be accepted"
      const tlsCertificate = "assets/cabundle-file.pem"
  
      cy.fleetNamespaceToggle('fleet-local');
      cy.addFleetGitRepo({ repoName, repoUrl, branch, path, tlsOption, tlsCertificate });
      cy.clickButton('Create');
      cy.verifyTableRow(0, 'Active', '1/1');
      cy.accesMenuSelection('local', 'Storage', 'Secrets');
  
      // Confirm cabundle secret is created
      cy.nameSpaceMenuToggle('All Namespaces');
      cy.filterInSearchBox(repoName+'-cabundle');
      cy.verifyTableRow(0, 'Active', repoName+'-cabundle');
  
      // Delete repo and confirm secret is deleted
      cy.deleteAllFleetRepos();
      cy.accesMenuSelection('local', 'Storage', 'Secrets');
      cy.contains('-cabundle').should('not.exist');
    })
  );  
});

