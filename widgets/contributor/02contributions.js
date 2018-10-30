//taken from widget 43 PRs open and closed
const moment = require("moment");
const widgetUtils = require("../widgetUtils");

function groupby(result, keyFormat, labelFormat, durationStep, linkBase, options) {
    if (result.length == 0) { return {labels:[], datasets: []}; };

    var minGroup = "zzzzzz";
    var byGroup = {open:{}, closed:{}};
    result.forEach(r => {
        var dt = moment(r.dt).format(keyFormat);
        if (r.dt < minGroup) minGroup = r.dt;
        byGroup[r.state][dt] = r.event_count;
    });

    var datasets = {open:[], closed:[]};
    var links = {open:[], closed:[]};
    var minGroup = moment(minGroup);
    var now = moment();
    var labels = [];

    while (minGroup < now) {
        var key = minGroup.format(keyFormat);
        labels.push(minGroup.format(labelFormat));
        datasets.open.push(byGroup.open[key] || 0);
        datasets.closed.push(byGroup.closed[key] || 0);
        var onone = minGroup.clone();
        onone.add(1, durationStep);
        links.open.push(linkBase+"?utf8=%E2%9C%93&q=is%3Apr%20is%3Aopen%20created%3A" +
            minGroup.format("YYYY-MM-DD") + ".." + onone.format("YYYY-MM-DD"));
        links.closed.push(linkBase+"?utf8=%E2%9C%93&q=is%3Apr%20is%3Aclosed%20created%3A" +
            minGroup.format("YYYY-MM-DD") + ".." + onone.format("YYYY-MM-DD"));
        minGroup.add(1, durationStep);
    }
    return {
        labels:labels,
        datasets: [{
            label: "Opened PRs",
            data: datasets.open,
            backgroundColor: options.COLORS[0],
            links: links.open
        }, {
            label: "Closed PRs",
            data: datasets.closed,
            backgroundColor: options.COLORS[2],
            links: links.closed
        }]
    }
}

module.exports = function(options, callback) {
        var linkBase = "www.fakeurl.com"; //changed this to fakeurl
        options.db.events.aggregate([
          // {$match: {'actor.login': 'danisyellis'}},   Maybe the match is done somewhere else to give us only this user...?
          //can I project without having matched? Or do I have to group?
/*          {$project: {
            shapes: {$filter: {
              input: '$shapes',
              as: 'shape',
              cond: {$eq: ['$$shape.color', 'red']}
            }},
            _id: 0
          }} */
          //assuming we're already matching on the user,
          {group: {
            _id: "$type",  //is this right? I'd like to group by type of event, but that might break this?
            event_count: {sum: 1},
            // state: {$first:"$state"},  does not having this break things?
            dt: {$first:{$substrCP:['$created_at', 0, 7]}}
          }},
            { $sort: { _id: 1 } }  //1 miiight mean smallest to greatest?? Do I need this?
        ], {allowDiskUse: true}, (err, result) => {
            if (err) return callback(err);

            var monthlyValues = groupby(result, "YYYY-MM", "MM-YYYY", "month", linkBase, options);
            monthlyValues.minimumLength = 5;
            monthlyValues.default = true;
            monthlyValues.sliderInitial = 24;

            /* get issue counts by day */
            options.db.pull_request.aggregate([
                { $group: {
                    _id: { $concat: [{$substrCP: ['$created_at', 0, 10]}, "$state"]},
                    issue_count: {$sum: 1},
                    state: {$first:"$state"},
                    dt: {$first:{$substrCP:['$created_at', 0, 10]}}
                } },
                { $sort: { _id: 1 } }
            ], {allowDiskUse: true}, (err, result) => {
                if (err) return callback(err);

                var weeklyValues = groupby(result, "YYYY-ww", "ww-YYYY", "week", linkBase, options);
                weeklyValues.minimumLength = 5;
                weeklyValues.sliderInitial = 104;

                var graph = {
                    title: "Contributions",
                    graphdata: JSON.stringify({
                        type: "bar",
                        data: {
                            adjustable: {
                                Monthly: widgetUtils.fillGaps(monthlyValues),
                                Weekly: widgetUtils.fillGaps(weeklyValues),
                            }
                        },
                        options: {
                            legend: {
                                display: true,
                                position: "top",
                                labels: {
                                    boxWidth: 2,
                                    fontSize: 8,
                                    fontColor: "white"
                                }
                            },
                            scales: {
                                xAxes: [{display: true, stacked: true, gridLines: {display: false}}],
                                yAxes: [{display: true, stacked: true, gridLines: {color: "#666666"}, ticks: {fontColor: "white"}}]
                            }
                        }
                    })
                }
                options.templates.graph(graph, callback);
            });
        }).catch(e => { callback(e); })
}