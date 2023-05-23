# sts mod rater
## setup
1. `npm install`
2. copy `cfg.example.json` to `cfg.json`
3. `npx sequelize-cli db:migrate`
4. `npm start`

## getting results
1. `node exportresults.js`
2. results will be exported to `results.json` and made publicly available at http://{site}/results