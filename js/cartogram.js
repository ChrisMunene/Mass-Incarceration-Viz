/*
 * CountVis - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data: perDayData
 */

Cartogram = function (_parentElements, _data, _eventHandler) {
    this.parentElements = _parentElements;
    this.data = _data;
    //this.eventHandler =
    this.stage = 0;
    this.zeroData = _.cloneDeep(this.data);
    _.each(this.zeroData.world, country => {
        if (country['Title'] == 'United States of America') {
            country['Prison Population Total'] = 0
        }
    });

    this.initVis();
};


/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

Cartogram.prototype.initVis = function () {

    const vis = this;

    vis.margin = {top: 40, right: 0, bottom: 60, left: 60};

    vis.colorScale = d3.scaleSequential(d3.interpolateReds)
        .domain([0, 800]);


    vis.width = 1300 - vis.margin.left - vis.margin.right,
        vis.height = 600 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElements[0]).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("id", `${vis.parentElements[0]}-svg`)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.svg.append("text")
        .attr("x", 0)
        .attr("class", "legend-label")
        .attr("y", -5)
        .text("Incarceration Rate Per 100,000 People");


    vis.scale = d3.scaleLinear() // v4
        .domain([0, 800])
        .range([0, 300]);  // clipped

    let axisGroup = vis.svg.append("g").attr("transform", "translate(0,20)");
    let axis = d3.axisTop() // v4
        .scale(vis.scale);
    axisGroup.call(axis);


    let scaleRange = _.range(300);
    vis.svg.selectAll("color-scale")
        .data(scaleRange)
        .enter()
        .append("rect")
        .attr("class", "color-scale")
        .attr("x", d => {
            return d;
        })
        .attr("y", 25)
        .attr("width", 1)
        .attr("height", 20)
        .attr("fill", d => {
            let val = vis.scale.invert(d);
            return vis.colorScale(val)
        });

    let nextButton = vis.svg.append("g")
        .attr("class", "next-button-group")
        .attr("transform", `translate(${vis.width - vis.margin.left},${vis.height / 2 - vis.margin.top}) scale(0.1)`);

    nextButton.append("path")
        .attr("d", "M128 192L0 320l192 192L0 704l128 128 320-320L128 192z")
        .attr("class", "next-button")
        .on("click", d => {
            return vis.usMap()
        });

    let prev = vis.svg.append("g")
        .attr("class", "prev-button-group")
        .attr("transform", `translate(0,${vis.height / 2 - vis.margin.top + 102}) scale(0.1) rotate(180)`);

    prev.append("path")
        .attr("d", "M128 192L0 320l192 192L0 704l128 128 320-320L128 192z")
        .attr("class", "prev-button")
        .on("click", d => {
            return vis.worldMap()
        });

    vis.tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([0, 100])
        .html(function (d) {
            return `<div class="tool-tip"><strong>${_.get(d, 'countryName') || _.get(d, 'stateName') || ''}</strong><br>
                    <table class="table table-borderless">
                      <tbody>
                        <tr>
                          <td>In Prison/Jail</td>
                          <td>${_.get(d, 'countryData["Prison Population Total"]') ||
            _.get(d, 'stateData["Total"]') || ''}</td>
                        </tr> 
                        <tr>
                          <td>Incarceration Rate per 100,000</td>
                          <td>${_.get(d, 'countryData["Prison Population Rate"]') ||
            _.get(d, 'stateData["Rate Per 100000 All Ages"]') || ''}</td>
                        </tr>
                        </tbody>
                        </table>
                    <div>`
        });

    vis.svg.call(vis.tip);
    vis.populationScale = vis.svg.append("g")
        .attr("transform", "translate(" + (vis.margin.left + 100) + "," + (vis.height + vis.margin.bottom) + ")");


    vis.similarCountriesSvg = d3.select("#" + vis.parentElements[1]).append("svg")
        .attr("id", `${vis.parentElements[1]}-svg`)
        .attr("width", 0)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g");

    vis.similarCountriesSvg.append("text")
        .attr("x", 200)
        .attr("y", 15)
        .attr("class", "similar-countries-title")
        .text("Countries w/ comparable prison populations");


    vis.similarCountriesSvg
        .append("rect")
        .attr("x", 0)
        .attr("y", 40)
        .attr("class", "similar-countries-inner-box")
        .attr("width", 500)
        .attr("height", 2000);
    vis.similarCountriesEmptyLabel = vis.similarCountriesSvg.append("g");
    vis.similarCountriesEmptyLabel.append("text")
        .attr("x", 200)
        .attr("y", 190)
        .attr("class", "similar-countries-inner")
        .text("click on a state");

    vis.similarCountriesDataGroup = vis.similarCountriesSvg.append("g");


    vis.similarCountriesEmptyLabel.append("text")
        .attr("x", 200)
        .attr("y", 230)
        .attr("class", "similar-countries-inner")
        .text("to view countries w/");

    vis.similarCountriesEmptyLabel.append("text")
        .attr("x", 200)
        .attr("y", 270)
        .attr("class", "similar-countries-inner")
        .text("similar jail + prison ");

    vis.similarCountriesEmptyLabel.append("text")
        .attr("x", 200)
        .attr("y", 310)
        .attr("class", "similar-countries-inner")
        .text("populations ");


    return vis.worldMap()
};

Cartogram.prototype.worldMap = function () {
    const vis = this;




    d3.select(`#${vis.parentElements[0]}-svg`).transition()
        .attr("width", vis.width + vis.margin.left + vis.margin.right);

    d3.select(`#${vis.parentElements[1]}-svg`).transition()
        .attr("width", 0)
        .attr("height", 0)

    vis.similarCountriesSvg.transition()
        .duration(1000)
        .ease(d3.easeCubic)
        .attr("transform", "translate(700,20) scale(0)");


    if(vis.similarCountriesEmptyLabel) {
        vis.similarCountriesEmptyLabel.transition()
            .duration(0)
            .attr("transform", "scale(1)");
    }

    if (vis.similarCountriesDataGroup) {
        vis.similarCountriesDataGroup.transition()
            .duration(0)
            .attr("transform", "scale(0)");
    }






    vis.populationScaleVals = [100000, 500000, 1000000, 2000000];
    vis.x = d3.scaleLinear()
        .range([0, 10000])
        .domain([0, d3.max(_.map(vis.data.worldData), country => {
            return country['Prison Population Total']
        })]);
    let countries = topojson.feature(vis.data.world, vis.data.world.objects.countries).features;

    vis.worldProjection = d3.geoMollweide()
        .scale(220)
        .translate([vis.width / 2 - 100, vis.height / 2 + 50]);

    vis.worldPath = d3.geoPath()
        .projection(vis.worldProjection);

    vis.nodes = _.map(countries, elem => {
        let node = {};
        node.centroid = vis.worldPath.centroid(elem);
        node.x = node.x0 = node.centroid[0];
        node.y = node.y0 = node.centroid[1];
        node.geoJson = elem;
        let countryName = _.find(vis.data.countryNames, name => {
            return _.toNumber(name.id) === _.toNumber(node.geoJson.id);
        });
        node.countryName = _.get(countryName, 'name', '');
        let countryData = _.find(vis.data.worldData, country => {
            return _.trim(node.countryName) === _.trim(country['Title'])
        });
        if (!countryData) {
            node.r = 0
        } else {
            node.countryData = countryData;
            node.r = Math.sqrt(vis.x(countryData['Prison Population Total']) / Math.PI)
        }
        return node;

    });

    vis.updateVis();
};


Cartogram.prototype.usMap = function () {
    const vis = this;

    d3.select(`#${vis.parentElements[0]}-svg`)
        .transition()
        .delay(1000)
        .duration(0)
        .attr("width", 750);

    d3.select(`#${vis.parentElements[1]}-svg`)
        .transition()
        .delay(1000)
        .duration(0)
        .attr("width", 400)
        .attr("height", 2000)



    vis.similarCountriesSvg.transition()
        .delay(1300)
        .duration(0)
        .attr("transform", "translate(0,0) scale(1)");

    vis.populationScaleVals = [50000, 100000, 200000, 300000];
    vis.x = d3.scaleLinear()
        .range([0, 10000])
        .domain([0, d3.max(_.map(vis.data.state), state => {
            return state['Total']
        })]);

    vis.usPath = d3.geoPath();


    let states = topojson.feature(vis.data.us, vis.data.us.objects.states).features;

    vis.nodes = _.map(states, elem => {
        let node = {};
        node.centroid = vis.usPath.centroid(elem);
        node.x = node.x0 = node.centroid[0] * 0.7 + 15;
        node.y = node.y0 = node.centroid[1] * 0.7 + 20;
        node.centroid = [node.x, node.y];
        node.geoJson = elem;

        let stateName = vis.data.fipsToState[elem.id];

        let stateData = _.find(vis.data.state, state => {
            return _.trim(stateName) == _.trim(state['State'])
        });

        node.stateName = stateName;
        if (!stateData) {
            node.r = 0
        } else {
            node.stateData = stateData;
            node.r = Math.sqrt(vis.x(stateData['Total']) / Math.PI)
        }
        return node;

    });

    return vis.updateVis();
};

Cartogram.prototype.updateVis = function () {
    const vis = this;


    let populationScaleCircles = vis.populationScale.selectAll(".legend-circle")
        .data(vis.populationScaleVals);

    populationScaleCircles.enter()
        .append("circle")
        .attr("class", "legend-circle")
        .merge(populationScaleCircles)
        .transition()
        .duration(1500)
        .ease(d3.easeCubic)
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", d => {
            return Math.sqrt(vis.x(d) / Math.PI)
        });

    populationScaleCircles.exit().remove();


    let populationScaleLabels = vis.populationScale.selectAll(".legend-text")
        .data(vis.populationScaleVals);
    populationScaleLabels.enter()
        .append("text")
        .attr("class", "legend-text")
        .merge(populationScaleLabels)
        .transition()
        .duration(1500)
        .ease(d3.easeCubic)
        .attr("x", d => {
            return 0
        })
        .attr("y", d => {
            return 0 - Math.sqrt(vis.x(d) / Math.PI) - 3
        })
        .text(d => {
            return _.toString(d)
        });
    populationScaleLabels.exit().remove();


    vis.populationScale.append("text")
        .attr("x", 0)
        .attr("y", -80)
        .attr("class", "legend-scale-title")
        .text("Population Scale Legend");

    vis.nodes = simulate(vis.nodes);


    let circles = vis.svg.selectAll(".world-circles")
        .data(vis.nodes);

    circles.enter()
        .append("circle")
        .on('mouseover', d => {
            return vis.tip.show(d)
        })
        .on('mouseout', vis.tip.hide)
        .on('click', d => {
            if (d.stateData) {
                return vis.drawSimilarCountries(d)
            }
        })
        .merge(circles)
        .transition()
        .duration(1500)
        .ease(d3.easeCubic)
        .attr("class", "world-circles")
        .attr("cx", d => {
            return d.x;
        })
        .attr("cy", d => {
            return d.y;
        })
        .attr("r", d => {
            return d.r;
        })
        .attr("fill", d => {
            return vis.colorScale(_.get(d, 'countryData["Prison Population Rate"]') ||
                _.get(d, 'stateData["Rate Per 100000 All Ages"]'))
        });


    circles.exit().remove();


    function simulate(nodes) {
        const simulation = d3.forceSimulation(nodes)
            .force("cx", d3.forceX().x(d => vis.width / 2).strength(0.02))
            .force("cy", d3.forceY().y(d => vis.height / 2).strength(0.02))
            .force("x", d3.forceX().x(d => d.x).strength(0.3))
            .force("y", d3.forceY().y(d => d.y).strength(0.3))
            .force("charge", d3.forceManyBody().strength(-1))
            .force("collide", d3.forceCollide().radius(d => d.r + 2).strength(0.8))
            .stop();

        while (simulation.alpha() > 0.01) {
            simulation.tick();
        }
        return nodes;
    }


};


Cartogram.prototype.drawSimilarCountries = function (state) {
    const vis = this;

    vis.similarCountriesDataGroup.transition()
        .duration(0)
        .attr("transform", "scale(1)");


    vis.similarCountriesEmptyLabel.transition()
        .duration(0)
        .attr("transform", "scale(0)");

    let similarCountries = _.sortBy(vis.data.worldData, country => {
        return Math.abs(state.stateData['Total'] - country['Prison Population Total'])
    });
    similarCountries = _.slice(similarCountries, 0, 20);
    let circleProperties = _.range(0, 20);
    _.forEach(similarCountries, (elem, i) => {
        let obj = {};
        obj.radius = Math.sqrt(vis.x(elem['Prison Population Total']) / Math.PI);
        obj.x = 200;
        if (i === 0) {
            obj.y = obj.radius + 70
        } else {
            obj.y = circleProperties[i - 1].y + 30 + circleProperties[i - 1].radius + obj.radius
        }
        obj.countryName = elem['Title'];
        obj.countryData = elem;
        circleProperties[i] = obj;
    });


    let stateTitle = vis.similarCountriesDataGroup.selectAll(".state-title")
        .data([state.stateName]);
    stateTitle.enter()
        .append("text")
        .merge(stateTitle)
        .transition()
        .attr("x", 200)
        .attr("y", 35)
        .attr("class", "state-title")
        .text(d => {
            return `to ${d}`
        });



    let similarCircles = vis.similarCountriesDataGroup.selectAll(".world-circles")
        .data(circleProperties);
    similarCircles.enter()
        .append("circle")
        .on('mouseover', d => {
            return vis.tip.show(d)
        })
        .on('mouseout', vis.tip.hide)
        .merge(similarCircles)
        .transition()
        .duration(1500)
        .ease(d3.easeCubic)
        .attr("class", "world-circles")
        .attr("cx", d => {
            return d.x;
        })
        .attr("cy", d => {
            return d.y;
        })
        .attr("r", d => {
            return d.radius;
        })
        .attr("fill", d => {
            return vis.colorScale(_.get(d, 'countryData["Prison Population Rate"]') ||
                _.get(d, 'stateData["Rate Per 100000 All Ages"]'))
        });


    let similarCircleTitles = vis.similarCountriesDataGroup.selectAll(".country-titles")
        .data(circleProperties);
    similarCircleTitles.enter()
        .append("text")
        .merge(similarCircleTitles)
        .transition()
        .duration(1500)
        .ease(d3.easeCubic)
        .attr("class", "country-titles")
        .attr("x", d => {
            return d.x;
        })
        .attr("y", d => {
            return d.y - d.radius - 5;
        })
        .text(d => {
            return d.countryName;
        })


};