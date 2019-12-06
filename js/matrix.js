/*
 * Matrix - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the area chart
 * @param _data			    -- the dataset 'families'
 * @param _marriages		-- marriages adjacency matrix
 * @param _business_ties    -- business adjacency matrix
 */

Matrix = function(_parentElement, _data, _size, _eventHandler, _tag, _index) {
  this.parentElement = _parentElement;
  this.data = _data;
  this.size = _size;
  this.selectedRange = null;
  this.eventHandler = _eventHandler;
  this.tag = _tag;
  this.actual_value = [4, 33, 31];
  this.total = [327.2, 14, 10];
  this.index = _index;
  this.displayData = [];

  this.initVis();
};

/*
 * Initialize visualization (static content; e.g. SVG area, axes)
 */

Matrix.prototype.initVis = function() {
  var vis = this;

  // Margins
  vis.margin = { top: 20, right: 200, bottom: 20, left: 20 };

  (vis.width = 620 - vis.margin.left - vis.margin.right),
    (vis.height = 440 - vis.margin.top - vis.margin.bottom);

  // SVG drawing area
  vis.svg = d3
    .select("#" + vis.parentElement)
    .append("svg")
    .attr("width", vis.width + vis.margin.left + vis.margin.right)
    .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
    .style("margin-left", -vis.margin.left + "px")
    .append("g")
    .attr(
      "transform",
      "translate(" + vis.margin.left + "," + vis.margin.top + ")"
    );

  // Scales
  vis.x = d3
    .scaleBand()
    .domain(d3.range(vis.size))
    .rangeRound([0, vis.width])
    .paddingInner(0.1);

  vis.y = d3
    .scaleBand()
    .domain(d3.range(vis.size))
    .rangeRound([0, vis.height])
    .paddingInner(0.1);

  var categories = ["Actual Selection", "Expected Selection"];
  vis.colorScale = d3
    .scaleOrdinal()
    .domain(categories)
    .range(["green", "red"]);

  // Legend
  vis.legend_g = vis.svg
    .append("g")
    .attr("class", "legendOrdinal")
    .attr("transform", "translate(400, 0)");

  vis.legendOrdinal = d3.legendColor().scale(vis.colorScale);

  vis.svg.select(".legendOrdinal").call(vis.legendOrdinal);

  // (Filter, aggregate, modify data)
  vis.wrangleData();
};

/*
 * Data wrangling
 */

Matrix.prototype.wrangleData = function() {
  var vis = this;

  // Merge datasets and Calculate relationships
  var count = 0;
  d3.range(vis.size).forEach((array, index) => {
    vis.displayData.push(
      d3.range(vis.size).map((d, i) => {
        count += 1;
        return count;
      })
    );
  });
  // Update the visualization
  vis.updateVis();
};

/*
 * The drawing function
 */

Matrix.prototype.updateVis = function() {
  var vis = this;
  // Rows
  vis.row = vis.svg
    .selectAll(`.row${vis.index}`)
    .data(vis.displayData)
    .enter()
    .append("g")
    .attr("class", `row${vis.index}`)
    .attr("transform", function(d, i) {
      return "translate(0," + vis.y(i) + ")";
    });

  // Create circles
  vis.circles = vis.row
    .selectAll(`.circle${vis.index}`)
    .data(function(d) {
      return d;
    })
    .enter()
    .append("circle")
    .attr("class", `circle${vis.index}`)
    .attr("cx", (d, i) => vis.x(i))
    .attr("r", (d, i) => vis.x.bandwidth() / 3)
    .attr("stroke-width", 1)
    .attr("stroke", "black")
    .attr("fill", "white");

  if (vis.selectedRange == null) {
    vis.circles.on("mouseover", val => {
      var num_selected = ((val / 100) * vis.total[vis.index]).toFixed(2);
      $(`#interactive-text-${vis.index}`).html(
        `<p class='intro-text'>You have selected <span class='green'>${num_selected}M</span> individuals (<span class="green">${val}%</span>) of the population</p>`
      );
      d3.selectAll(`.row${vis.index}`)
        .selectAll(`.circle${vis.index}`)
        .attr("fill", (d, i) => (d <= val ? "green" : "white"));
    });

    vis.circles.on("click", val => {
      var num_selected = ((val / 100) * vis.total[vis.index]).toFixed(2);
      $(`#interactive-text-${vis.index}`).empty();

      $(vis.eventHandler).trigger(vis.tag, val);
      vis.circles.on("mouseover", null);
      vis.circles.on("click", null);
    });
  }
};

/*
 * The sorting function
 */
Matrix.prototype.setSelectedRange = function(value) {
  var vis = this;
  vis.selectedRange = value;
  var num_selected = ((vis.selectedRange / 100) * vis.total[vis.index]).toFixed(
    2
  );
  var diff = vis.selectedRange - vis.actual_value[vis.index];
  $(`#intro-text-${vis.index}`).text(
    "Thanks for selecting. Here's how you did: "
  );

  const details = [
    {
      title: "Your Guess",
      body: `<p>You have selected <span class="bold green">${vis.selectedRange}%</span> of the population(<span class="bold green">${num_selected}M</span> individuals).</p>`
    },
    {
      title: "Actual Data",
      body: `<p>In reality, about <span class='bold red'>${
        vis.actual_value[vis.index]
      }%</span> of the population(<span class=" bold red">${
        vis.total[vis.index]
      }M</span> indiviuals) in the US are currently incarcerated.</p>${
        diff != 0
          ? `<p>You <span class="red">${
              diff > 0 ? "overestimated" : "underestimated"
            }</span> the real value by <span class="red">${Math.abs(
              diff.toFixed(2)
            )}%</span>.</p>`
          : `<p>You got it right!!</p>`
      }`
    }
  ];
  let detailsDiv = document.querySelector(`#interactive-text-${vis.index}`);
  details.forEach(detail => {
    const html = `<div class="card details-card">
    <div class="card-body">
      <h5 class="card-title">${detail.title}</h5>
      <p class="card-text">
        ${detail.body}
      </p>
    </div>
  </div>`;
    detailsDiv.innerHTML += html;
  });

  d3.selectAll(`.row${vis.index}`)
    .selectAll(`.circle${vis.index}`)
    .attr("fill", (d, i) => getColor(d, i));

  function getColor(d, i) {
    var diff = vis.selectedRange - vis.actual_value[vis.index];
    if (diff > 0) {
      if (d <= vis.actual_value[vis.index]) {
        return "red";
      } else if (d > vis.actual_value[vis.index] && d <= vis.selectedRange) {
        return "green";
      } else {
        return "white";
      }
    } else if (diff < 0) {
      if (d > vis.selectedRange && d <= vis.actual_value[vis.index]) {
        return "red";
      } else if (d <= vis.selectedRange) {
        return "green";
      } else {
        return "white";
      }
    } else {
      if (d <= vis.selectedRange) {
        return "red";
      } else {
        return "white";
      }
    }
  }
  vis.circles.on("mouseover", null);
  vis.circles.on("click", null);
};
