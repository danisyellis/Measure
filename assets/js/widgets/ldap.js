(function() {
    var ns = document.querySelector("section.ldap");
    var login = ns.getAttribute("data-login");
    var ul = ns.querySelector("ul");

    function displayLDAP() {
        API("GET", "getLDAP", {"login": login}, function(err, ldapArray) {
            if (err) return flash(err);
            var frag = document.createDocumentFragment();
            ldapArray.rows.forEach(function(row) {
                var li = document.createElement("li");
                li.appendChild(document.createTextNode(row.ldap + " "));
                frag.appendChild(li);
            })
            ul.innerHTML = "";
            ul.appendChild(frag);
        })
    }
    document.addEventListener("DOMContentLoaded", displayLDAP, false);
})();