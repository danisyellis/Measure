let API = require("./main");
let l = "theldap";
let github = "danisyellis"
function addLDAP() {
    API("POST", "addLDAP", {login: github, ldap: l}, function(err, res) {
        //if (err) return flash("Couldn't save ldap", err);
        if (!res.success) { return flash("Couldn't save ldap", res.msg); }
        console.log("THE RES: ", res)
    })
}

addLDAP()