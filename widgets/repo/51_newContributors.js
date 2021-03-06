const moment = require("moment");

module.exports = function(options, callback) {
    const oneMonthAgo = moment().add(-1, "month").toISOString();
    options.db.issue_comment.distinct("user.login", {created_at:{$gte:oneMonthAgo}}, (err, recentIssueUsers) => {
        if (err) return callback(err);
        options.db.issue_comment.distinct("user.login", {created_at:{$lt:oneMonthAgo}}, (err, oldIssueUsers) => {
            if (err) return callback(err);
            options.db.pull_request.distinct("user.login", {created_at:{$gte:oneMonthAgo}}, (err, recentPRUsers) => {
                if (err) return callback(err);
                options.db.pull_request.distinct("user.login", {created_at:{$lt:oneMonthAgo}}, (err, oldPRUsers) => {
                    if (err) return callback(err);
                    let recentUsers = recentIssueUsers.concat(recentPRUsers);
                    let oldUsers = oldPRUsers.concat(oldIssueUsers);
                    let newUsers = [];
                    recentUsers.forEach(r => { 
                        if (oldUsers.indexOf(r) == -1) newUsers.push(r);
                    })
                    newUsers = Array.from(new Set(newUsers)).sort((a,b) => {
                        return a.toLowerCase().localeCompare(b.toLowerCase());
                    });
                    var result = {
                        title: "New contributors",
                        list: newUsers.map(u => { 
                            return {html: '<a href="' + options.url("contributor", u) + '">' + u + '</a>'}; 
                        })
                    }
                    options.templates.list(result, callback);
                });
            });
        });
    })
}