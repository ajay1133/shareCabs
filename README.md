## Compass

### Local Environment Setup
* Use Node Version: 10.x.x

* Clone Project: git clone git@bitbucket.org:simsaw/compass-engagement.git

* Switch to staging Branch: git checkout staging

* Install Node Packages: npm install

* Copy src/config_bak.js => src/config.js

* Copy config/db_bak.js => config/db.js

* Run Command (create db, migration, seeders): npm run db

* Run Client App: npm start

* Run API: npm run dev-api

* Swagger API: http://localhost:5000/documentation

* Admin User Details: admin@simsaw.com/admin123


#### Development process for new tasks:

* Create task specific branch from staging always. For example: git checkout -b com-<TASKNO>

* Send Pull Request to staging branch.

* Pull Staging before sending pull request

* Always pull from staging when you start your work



