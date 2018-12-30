# Installing Dependencies

* Node Package Manager (NPM)
* Truffle Framework
* Ganache (optional)
* Metamask

# Steps to use it

* type ```npm install``` in the Command Prompt  to install those dependent packets
* change the address of blockchain in file```./truffle-config.js``` and ```./src/js/app.js```. It is easy to find the position of address, and the default address is [localhost:7545](localhost:7545)
* modify ```./migrations/2_deploy_contracts.js``` as you want
* type ```truffle migrate --reset``` to deploy the contract and type ```npm run dev``` to start the server.
* visit[localhost:3000](localhost:3000)to enjoy the dAPP

# license

* This dAPP is adapted from "pet-shop", which is provided by truffle. The license is given in the directory.
* Study used only. DO NOT use in any commercial way. 