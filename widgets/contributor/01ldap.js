module.exports = function(options, callback) {
  console.log("OPTIONS IN LDAP", options.limitedTo); //logging this out tells me who it's building this widget for

    options.db.user.find({}).toArray().then(user => { // we're limited to this user by the framework
        options.templates.ldap({login:user[0].login}, callback);
    }).catch(e => { callback(e); });
}