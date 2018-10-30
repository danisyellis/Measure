var fn = function(options, callback) {
    let gitHubHandle = options.limitedTo;
    let arrayOfImportantEvents = [];
    options.db.events.find({"elements.actor.login":gitHubHandle}).toArray()
    .then(events => {
        events.forEach(eventDocument=> {
          for(let i=0; i<eventDocument.elements.length; i++) {
            let event = eventDocument.elements[i];
            switch(event.type) {
              case 'CommitCommentEvent':
              case 'IssueCommentEvent':
              case 'IssuesEvent':
              case 'PullRequestEvent':
              case 'PullRequestReviewEvent':
              case 'PullRequestReviewCommentEvent':
                arrayOfImportantEvents.push(event);
                break;
            }
          }
        })
        var result = {
          title: `Contributions by ${gitHubHandle}`,
          list: arrayOfImportantEvents.map(event => {
            return {html: '<p>' + event.type + '</p>'};
          })
        }
        options.templates.list(result, callback);
    }).catch(error => {callback(error)})
  }
module.exports = fn;