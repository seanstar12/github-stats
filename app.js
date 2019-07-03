const Repo = require('./Repo');

const githubToken = '';
//const repos = [
//  'GSA/code-gov-api'
//];

var test = new Repo('GSA/code-gov-front-end', githubToken);
test.getBasicInfo().then((data) => { console.log('basicInfo', data) });
//test.getStarsDeep().then((data) => { console.log('stars', data.length) });
//test.getSubscribersDeep().then((data) => { console.log('subscribers', data.length) });

//test.getOrgUsersDeep({extra: {org:'GSA'}}).then((data) => { console.log('orgUsers', data) });
test.getPullReqsDeep({extra: {state:'all'}}).then((data) => { console.log('all PRs', data) });
//test.getPullReqsDeep({extra: {state:'closed'}}).then((data) => { console.log('closed PRs', data) });
//test.getPullReqsDeep({extra: {state:'open'}}).then((data) => { console.log('open PRs', data) });
