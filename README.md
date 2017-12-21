## Prerequisites

- [NodeJS 6.x](https://nodejs.org/en/download/)

- [MongoDB Community](https://www.mongodb.com/download-center#community)

## Config

### From the root of source code, run these commands:

	$ cp config/index.js.example config/index.js
	$ npm install

## Run

### From the root of source code, run these commands to initialize 1 Node on port 1000

	$ npm install
	$ chmod +x run.sh
	$ ./run.sh 1000

### Open new CLI and initialize 3 other Nodes on ports: 2000, 3000, 4000

### To simulate Bitcoin Mining on random Nodes, run
	$ node client.js

## Use

Open [http://localhost:1000](http://localhost:1000) or [http://127.0.0.1:1000](http://127.0.0.1:1000) in browser (Chrome, Firefox, ...)
