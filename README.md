# sts mod rater
## setup
1. copy `cfg.example.json` to `cfg.json`
2. in `cfg.json` set `port` to the port you want to run the web server on and set `url` to the root url that the site will be accesed from (e.g. `https://example.com`)
3. get a [discord developer application](https://discord.com/developers/applications/me) and in `cfg.json` set `id` and `secret` to its client id and client secret respectively
4. in the discord application's OAuth settings, add a redirect uri to {site}/login/cb (e.g. `https://example.com/login/cb`)
5. `npm install`
6. `npx sequelize-cli db:migrate`
7. `npm start`

## getting results
1. `node exportresults.js`
2. results will be exported to `results.json` and made publicly available at http://{site}/results