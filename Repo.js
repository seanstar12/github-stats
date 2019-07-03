'use strict';

const request = require('request');
const promise = require('promise');
const EventEmitter = require('events');
const async = require('async');

const githubApi = 'https://api.github.com/';

class Repo {
  constructor(repo, token) {
    this.repo = repo; 
    this.token = token; 
    this.emitter = new EventEmitter();
    this.stars = 0;
    this.forks = 0;
  }

  getRepoName() {
    return `${this.repo}`;
  }

  getRaw() {
    return this.doRequest().then((obj) => { return obj.body });
  }

  // command -> github api endpoint i.e.: stargazers, forks, issues/events
  doRequest(cmd = null, params = {}) {
    var _url = githubApi + 'repos/' + this.repo;
    if (cmd) _url = _url + '/' + cmd;

    var opts = {
      method: 'GET',
      url: cmd,
      headers: {
        'User-Agent': 'request',
        'Authorization': 'token ' + this.token,
      }
    };

    var outObj = {
      body: {},
      page: 1
    };

    if (params.hasOwnProperty('headers')) {
      opts.headers = Object.assign(opts.headers, params.headers);
    }
    if (params.hasOwnProperty('extra')) {
      outObj.extra = Object.assign(params.extra);
    }

    if (!params.hasOwnProperty('page')) params.page = 1;

    return new Promise((resolve, reject) => {
      request(opts, (err, resp, body) => {
        outObj.body = JSON.parse(body);
        outObj.page = params.page;

        if (resp.headers.hasOwnProperty('link')
            && resp.headers.link.includes('rel="next"')) {
          outObj.page++;
        }

        resolve(outObj);
      });
    });
  }

  getBasicInfo(repo = this.repo) {
    var cmd = githubApi + 'repos/' + repo;

    return this.doRequest(cmd, {
      'headers' : {
      },
    }).then((data) => {
      data = data.body;

      return {
        name: data.name,
        org: {
          login: data.organization.login,
          id: data.organization.id
        },
        stars: data.stargazers_count,
        forks: data.forks_count,
        watchers: data.watchers_count,
        openIssues: data.open_issues_count,
      }
    });
  }

  getPullReqsDeep(obj = {}) {
    // add appropriate properties to class if they don't exist
    var state = 'open';
    if (!obj.hasOwnProperty('prevBody')) obj.prevBody = {};
    if (!obj.hasOwnProperty('page')) obj.page = 1;
    if (obj.hasOwnProperty('extra') && obj.extra.hasOwnProperty('state')) {
      state = obj.extra.state;
    }
    var cmd = githubApi + 'repos/' + this.repo + '/pulls?page=' + obj.page + '&state=' + state;

    return this.doRequest(cmd, {
      'headers' : {
      },
      'prevBody': obj.prevBody,
      'page': obj.page,
      'state': obj.state,
    }).then((data) => {
      var _data = data.body;

      // if we have a prevBody (multiple pages)
      // merge the two arrays
      if (obj.prevBody.length) {
        _data = data.body.concat(obj.prevBody);
      }

      // if we have a next page, recall the function passing
      // in prevBody & the new page number to fetch
      // else return the data array
      if (data.page > obj.page) {
        return this.getPullReqsDeep({
          prevBody: _data,
          page: data.page,
          extra: {
            state: state
          }
        });
      }
      else {
        return _data;
      }
    });
  }

  getStarsDeep(obj = {}) {
    // add appropriate properties to class if they don't exist
    if (!obj.hasOwnProperty('prevBody')) {
      obj.prevBody = {};
    }
    if (!obj.hasOwnProperty('page')) {
      obj.page = 1;
    }

    var cmd = githubApi + 'repos/' + this.repo + '/stargazers?page=' + obj.page;

    return this.doRequest(cmd, {
      'headers' : {
        'Accept': 'application/vnd.github.v3.star+json'
      },
      'prevBody': obj.prevBody,
    }).then((data) => {
      var _data = data.body;

      // if we have a prevBody (multiple pages)
      // merge the two arrays
      if (obj.prevBody.length) 
        _data = data.body.concat(obj.prevBody);

      // if we have a next page, recall the function passing
      // in prevBody & the new page number to fetch
      // else return the data array
      if (data.page > obj.page) {
        return this.getStarsDeep({prevBody: _data, page: data.page });
      }
      else {
        return _data;
      }
    });
  }

  getSubscribersDeep(obj = {}) {
    // add appropriate properties to class if they don't exist
    if (!obj.hasOwnProperty('prevBody')) {
      obj.prevBody = {};
    }
    if (!obj.hasOwnProperty('page')) {
      obj.page = 1;
    }

    var cmd = githubApi + 'repos/' + this.repo + '/subscribers?page=' + obj.page;
    return this.doRequest(cmd, {
      'headers' : {
        'Accept': 'application/vnd.github.v1+json'
      },
      'prevBody': obj.prevBody,
    }).then((data) => {
      var _data = data.body;

      // if we have a prevBody (multiple pages)
      // merge the two arrays
      if (obj.prevBody.length) 
        _data = data.body.concat(obj.prevBody);

      // if we have a next page, recall the function passing
      // in prevBody & the new page number to fetch
      // else return the data array
      if (data.page > obj.page) {
        return this.getSubscribersDeep({prevBody: _data, page: data.page });
      }
      else {
        return _data;
      }
    });
  }

  getOrgUsersDeep(obj = {}) {
    // add appropriate properties to class if they don't exist
    var org = 'GSA';

    if (!obj.hasOwnProperty('prevBody')) {
      obj.prevBody = {};
    }
    if (!obj.hasOwnProperty('page')) {
      obj.page = 1;
    }
    if (obj.hasOwnProperty('extra') && obj.extra.hasOwnProperty('org')) {
      org = obj.extra.org;
    }

    //console.log('page: ', obj.page);
    var cmd = githubApi + 'orgs/' + org + '/members?page=' + obj.page;
    return this.doRequest(cmd, {
      'headers' : {
        'Accept': 'application/vnd.github.v3+json'
      },
      'prevBody': obj.prevBody,
    }).then((data) => {
      var _data = data.body;

      // if we have a prevBody (multiple pages)
      // merge the two arrays
      if (obj.prevBody.length) 
        _data = data.body.concat(obj.prevBody);

      // if we have a next page, recall the function passing
      // in prevBody & the new page number to fetch
      // else return the data array
      if (data.page > obj.page) {
        return this.getOrgUsersDeep({prevBody: _data, page: data.page });
      }
      else {
        var array = [];
        _data.forEach(item => {
          array.push(item.login); 
        });
        return array;
      }
    });
  }
}

module.exports = Repo;
