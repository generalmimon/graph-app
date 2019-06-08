/* jshint browser: true */
var Draw;
Math.hypot = Math.hypot || function() {
	var y = 0, i = arguments.length;
	while (i--) y += arguments[i] * arguments[i];
	return Math.sqrt(y);
};
var GraphApp = function() {
	var app = this;
	var el = {};
	this.graph = null;
	this.choosedTool = null;
	this.canvMousePressed = false;
	this.propBox = null;
	this.pathBox = null;
	var ctx;
	/*var */Draw = {
		VERTEX_R: 10,
		LINE_BBOX_HALF_W: 8,
		Color: {
			Default: 0,
			Temp: 1,
			Selected: 2,
			Start: 3,
			End: 4
		},
		COLORS: {
			0: "black",
			1: "gray",
			2: "blue",
			3: "limegreen",
			4: "red"
		},
		tempSelectedVertex: null,
		selectedVertex: null,
		pathLock: false,
		highlightedEdges: {},
		tempSelectedEdge: [],
		vertexCoords: {},
		ifCirclesOverlap: function(c1, c2, rSumSqr) {
			var dx = c1.x - c2.x,
				dy = c1.y - c2.y;
			var distSqr = (dx * dx) + (dy * dy);
			if(distSqr < rSumSqr) {
				return true;
			}
			return false;
		},
		getVertexOfPoint: function(p) {
			var rSq = this.VERTEX_R * this.VERTEX_R, v;
			for(var i in this.vertexCoords) {
				if(this.vertexCoords.hasOwnProperty(i)) {
					i = Number(i);
					v = this.vertexCoords[i];
					if(this.ifCirclesOverlap(p, v, rSq)) {
						return i;
					}
				}
			}
			return null;
		},
		getEdgeOfPoint: function(p) {
			var edges = {}, nbrs, edgeMissing;
			for(var i in this.vertexCoords) {
				if(this.vertexCoords.hasOwnProperty(i)) {
					i = Number(i);
					nbrs = app.graph.getNeighbours(i);
					for(var j = 0, nlen = nbrs.length; j < nlen; j++) {
						var a = Math.min(i, nbrs[j]),
							b = Math.max(i, nbrs[j]);
						edgeMissing = false;
						if(!edges.hasOwnProperty(a)) {
							edges[a] = {};
							edgeMissing = true;
							
						}
						if(!edges[a].hasOwnProperty(b)) {
							edges[a][b] = true;
							edgeMissing = true;
						}
						if(edgeMissing) {
							this.edgeBoundingBox(a, b);
							if(ctx.isPointInPath(p.x, p.y)) {
								return [a, b];
							}
						}
					}
				}
			}
			return [];
		},
		edgeBoundingBox: function(a, b) {
			var edge = [
				this.vertexCoords[a],
				this.vertexCoords[b]
			];
			var dirV = new Vector(
				edge[1].x - edge[0].x,
				edge[1].y - edge[0].y
			).normalize();
			var v = dirV.multiply(this.LINE_BBOX_HALF_W),
				lHand = v.leftHand(),
				rHand = v.rightHand();
			ctx.beginPath();
			ctx.moveTo(edge[0].x + lHand.x, edge[0].y + lHand.y);
			ctx.lineTo(edge[1].x + lHand.x, edge[1].y + lHand.y);
			ctx.lineTo(edge[1].x + rHand.x, edge[1].y + rHand.y);
			ctx.lineTo(edge[0].x + rHand.x, edge[0].y + rHand.y);
			ctx.closePath();
		},
		getVertexColor: function(i) {
			var color = this.Color.Default;
			if(i === this.tempSelectedVertex || i === this.selectedVertex) {
				if(app.choosedTool === "find-path") {
					if(i === this.tempSelectedVertex && this.selectedVertex !== null && this.selectedVertex !== i) {
						color = this.Color.End;
					} else {
						color = this.Color.Start;
					}
				} else {
					color = this.Color.Selected;
				}
			}
			console.log("color", color);
			return color;
		},
		getEdgeColor: function(a, b) {
			var color = this.Color.Default,
				newA = Math.min(a, b),
				newB = Math.max(a, b);
			if(!this.pathLock) {
				if((a === this.tempSelectedEdge[0] && b === this.tempSelectedEdge[1]) || (a === this.selectedEdge[0] && b === this.selectedEdge[1])) {
					color = this.Color.Selected;
				}
			} else {
				if(this.highlightedEdges.hasOwnProperty(a) && this.highlightedEdges[a].hasOwnProperty(b)) {
					color = this.Color.Selected;
				}
			}
			return color;
		},
		redraw: function() {
			var canv = ctx.canvas,
				drawnEdges = {},
				nbrs,
				edgeMissing = false;
			ctx.clearRect(0, 0, canv.width, canv.height);
			for(var i in this.vertexCoords) {
				if(this.vertexCoords.hasOwnProperty(i)) {
					i = Number(i);
					this.vertex(this.vertexCoords[i], i + 1, this.getVertexColor(i));
					nbrs = app.graph.getNeighbours(i);
					for(var j = 0, nlen = nbrs.length; j < nlen; j++) {
						var a = Math.min(i, nbrs[j]),
							b = Math.max(i, nbrs[j]);
						edgeMissing = false;
						if(!drawnEdges.hasOwnProperty(a)) {
							drawnEdges[a] = {};
							edgeMissing = true;
						}
						if(!drawnEdges[a].hasOwnProperty(b)) {
							drawnEdges[a][b] = true;
							edgeMissing = true;
						}
						if(edgeMissing) {
							this.edge(a, b, this.getEdgeColor(a, b));/*((a === this.tempSelectedEdge[0] && b === this.tempSelectedEdge[1]) || (a === this.selectedEdge[0] && b === this.selectedEdge[1])) ? this.Color.Selected : this.Color.Default*/
						}
					}
				}
			}
		},
		getCoords: function(canv, event) {
			var bbox = canv.getBoundingClientRect();
			return {
				x: Math.floor(event.clientX - bbox.left),
				y: Math.floor(event.clientY - bbox.top)
			};
		},
		vertex: function(pos, text, color) {
			ctx.beginPath();
			ctx.arc(pos.x, pos.y, this.VERTEX_R, 0, 2 * Math.PI);
			ctx.strokeStyle = this.COLORS[color];
			ctx.fillStyle = this.COLORS[color];
			ctx.stroke();
			ctx.font = "14px Calibri";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(text, pos.x, pos.y);
		},
		edge: function(a, b, color) {
			var newA = Math.min(a, b),
				newB = Math.max(a, b);
			ctx.beginPath();
			var aP = this.vertexCoords[newA],
				bP = this.vertexCoords[newB];
			var dx = bP.x - aP.x,
				dy = bP.y - aP.y;
			var abdist = Math.hypot(dx, dy);
			var x = (this.VERTEX_R * dx) / abdist,
				y = (this.VERTEX_R * dy) / abdist;
			var x1 = aP.x + x,
				y1 = aP.y + y,
				x2 = bP.x - x,
				y2 = bP.y - y;
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.strokeStyle = this.COLORS[color];
			ctx.fillStyle = this.COLORS[color];
			ctx.stroke();
			var textShift = new Vector(dx, dy).leftHand().normalize().multiply(10),
				textPos = {x: (aP.x + bP.x) / 2 + textShift.x, y: (aP.y + bP.y) / 2 + textShift.y};
			ctx.font = "12px Calibri";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(app.graph.getEdgeValue(newA, newB), textPos.x, textPos.y);
		}
	};
	var SideBox = function() {};
	SideBox.prototype.els = {};
	SideBox.prototype.legend = "";
	SideBox.prototype.contents = null; // DocumentFragment
	SideBox.prototype.buildUI = function() {
		var els = {
			box: document.createElement("fieldset"),
			legend: document.createElement("legend"),
			contents: document.createElement("div")
		};
		els.box.className = "sidebox";
		els.legend.textContent = this.legend;
		els.box.appendChild(els.legend);
		els.box.appendChild(els.contents);
		el.sideBoxCont.appendChild(els.box);
		this.els = els;
	};
	SideBox.prototype.setLegend = function(legend) {
		this.legend = legend;
		this.els.legend.innerHTML = this.legend;
	};
	SideBox.prototype.clearContents = function() {
		this.els.contents.innerHTML = "";
	};
	SideBox.prototype.updateContents = function() {
		this.els.contents.appendChild(this.contents);
	};
	SideBox.prototype.destroy = function() {
		el.sideBoxCont.removeChild(this.els.box);
	};
	var PropertiesBox = function() {
		this.contents = new DocumentFragment();
		this.buildUI();
	};
	PropertiesBox.prototype = new SideBox();
	PropertiesBox.prototype.addProperty = function(prop) {
		var propCont = document.createElement("div"),
			labelEl = document.createElement("label"),
			valueInp = document.createElement(prop.editable ? "input" : prop.type);
		propCont.className = "property";
		valueInp.className = "value";
		if(prop.hasOwnProperty("id")) {
			labelEl.htmlFor = prop.id;
			valueInp.id = prop.id;
		}
		switch(prop.type) {
			case "p": 
			case "span": {
				valueInp.innerHTML = prop.value;
				break;
			}
			case "ul": {
				if(Array.isArray(prop.value)) {
					console.log("jsme tam");
					for(var i = 0, l = prop.value.length; i < l; i++) {
						var li = document.createElement("li");
						li.innerHTML = prop.value[i];
						valueInp.appendChild(li);
					}
				}
				break;
			}
			default: {
				if(prop.editable) {
					valueInp.type = prop.type || "text";
					valueInp.value = prop.value;
					valueInp.onchange = function(ev) {
						var clbk = prop.changeCallback,
							arg = clbk.arg.slice(0);
						arg.push(valueInp.value);
						clbk.func.apply(clbk.thisArg, arg);
						console.log("change", clbk.func.name, arg);
						Draw.redraw();
					};
				}
				break;
			}
		}
		if(prop.hasOwnProperty("attr")) {
			for(var attrName in prop.attr) {
				valueInp[attrName] = prop.attr[attrName];
			}
		}
		labelEl.textContent = prop.label + ": ";
		
		
		propCont.appendChild(labelEl);
		propCont.appendChild(valueInp);
		this.contents.appendChild(propCont);
		this.updateContents();
	};
		/*
			- Start
			- Cíl
			- Délka (nejkr.) cesty
			- Itinerář
		*/
	function compareNumbers(a, b) {
		return a - b;
	}
	this.updateProperties = function() {
		var label = "";
		app.propBox.clearContents();
		if(Draw.selectedVertex !== null) {
			var v = Draw.selectedVertex;
			var nbrs = app.graph.getNeighbours(v);
			nbrs.sort(compareNumbers);
			for(var i = 0, nlen = nbrs.length; i < nlen; i++) {
				nbrs[i]++;
			}
			label = "Vrchol " + (v + 1);
			app.propBox.addProperty({
				id: "vertex-name",
				label: "Název",
				value: app.graph.getVertexValue(v),
				editable: true,
				changeCallback: {
					func: app.graph.setVertexValue,
					thisArg: app.graph,
					arg: [v]
				},
			});
			app.propBox.addProperty({
				label: "Sousední vrcholy",
				value: nbrs.join(", "),
				type: "span"
			});
		} else if(Draw.selectedEdge.length > 0) {
			label = "Hrana " + (Draw.selectedEdge[0] + 1) + "–" + (Draw.selectedEdge[1] + 1);
			app.propBox.addProperty({
				label: "Názvy vrcholů",
				value: (app.graph.getVertexValue(Draw.selectedEdge[0]) || "<em>Vrchol " + (Draw.selectedEdge[0] + 1) + "</em>") + " – " + (app.graph.getVertexValue(Draw.selectedEdge[1]) || "<em>Vrchol " + (Draw.selectedEdge[1] + 1) + "</em>"),
				type: "span"
			});
			app.propBox.addProperty({
				id: "rank",
				label: "Ohodnocení",
				value: app.graph.getEdgeValue(Draw.selectedEdge[0], Draw.selectedEdge[1]),
				editable: true,
				type: "number",
				attr: {
					min: "0"
				},
				changeCallback: {
					func: app.graph.setEdgeValue,
					thisArg: app.graph,
					arg: [Draw.selectedEdge[0], Draw.selectedEdge[1]]
				}
			});
		} else {
			label = "Graf";
			app.propBox.addProperty({
				label: "Počet vrcholů",
				value: app.graph.getVertexCount(),
				type: "span"
			});
			app.propBox.addProperty({
				label: "Počet hran",
				value: app.graph.getEdgeCount(),
				type: "span"
			});
		}
		app.propBox.setLegend("Vlastnosti – " + label);
	};
	this.updatePathBox = function(start, end) {
		app.pathBox.clearContents();
		app.pathBox.setLegend("Najít cestu");
		var startval = app.graph.getVertexValue(start),
			endval = app.graph.getVertexValue(end);
		app.pathBox.addProperty({
			label: "Start",
			value: (start || start === 0) ? ((start + 1).toString() + (startval ? " (" + startval + ")" : "")) : "",
			type: "span"
		});
		app.pathBox.addProperty({
			label: "Cíl",
			value: (end || end === 0) ? ((end + 1).toString() + " " + (endval ? " (" + endval + ")" : "")) : "",
			type: "span"
		});
		if((start || start === 0) && (end || end === 0)) {
			var path = app.graph.Dijkstra(start, end);
			console.log(path);
			app.pathBox.addProperty({
				label: "Délka",
				value: (path.d === Infinity) ? "∞" : (Math.round(path.d * 100) / 100),
				type: "span"
			});
			if(path.s.length > 1) {
				var p = [], bold = false;
				for(var i = 0, vlen = path.s.length, val; i < vlen; i++, bold = false) {
					if(i === 0 || i === vlen - 1) bold = true;
					if(i > 0) {
						var a = Math.min(path.s[i - 1], path.s[i]),
							b = Math.max(path.s[i - 1], path.s[i]);
						if(!Draw.highlightedEdges.hasOwnProperty(a)) {
							Draw.highlightedEdges[a] = {};
						}
						Draw.highlightedEdges[a][b] = true;
						console.log("path ", a, b);
					}
					val = app.graph.getVertexValue(path.s[i]);
					p.push((bold ? "<b>" : "") + (path.s[i] + 1) + (bold ? "</b>" : "") + (val ? " (" + val + ")" : ""));
				}
				app.pathBox.addProperty({
					label: "Cesta",
					value: p,
					type: "ul"
				});
			}
		}
	};
	var eventListeners = {
		canvMouseDown: function(ev) {
			var p = Draw.getCoords(ev.target, ev), v, e;
			switch(app.choosedTool) {
				case "add-vertex": {
					var id = app.graph.addVertex();
					Draw.vertexCoords[id] = p;
					Draw.redraw();
					break;
				}
				case "add-edge": {
					var selVBefore = Draw.selectedVertex;
					v = Draw.getVertexOfPoint(p);
					if(Draw.selectedVertex === null || Draw.tempSelectedVertex === null) {
						Draw.selectedVertex = v;
						if(selVBefore !== v) {
							Draw.redraw();
						}
					}
					break;
				}
				case "remove-vertex": {
					if(Draw.tempSelectedVertex !== null) {
						v = Draw.tempSelectedVertex;
						delete Draw.vertexCoords[v];
						app.graph.removeVertex(v);
						Draw.redraw();
					}
					break;
				}
				case "remove-edge": {
					if(Draw.tempSelectedEdge.length > 0) {
						app.graph.removeEdge(Draw.tempSelectedEdge[0], Draw.tempSelectedEdge[1]);
						Draw.tempSelectedEdge = [];
						Draw.redraw();
					}
					break;
				}
				case "properties": {
					v = Draw.getVertexOfPoint(p);
					Draw.selectedVertex = v;
					e = Draw.getEdgeOfPoint(p);
					Draw.selectedEdge = (v === null) ? e : [];
					app.updateProperties();
					Draw.redraw();
					break;
				}
				case "find-path": {
					v = Draw.getVertexOfPoint(p);
					if(Draw.selectedVertex !== v) {
						if(!Draw.pathLock) {
							if(Draw.selectedVertex === null || v === null) {
								Draw.selectedVertex = v;
								app.updatePathBox(Draw.selectedVertex);
								Draw.redraw();
							} else {
								console.log("najít cestu z ", Draw.selectedVertex, "do", v);
								app.updatePathBox(Draw.selectedVertex, v);
								
								Draw.pathLock = true;
								Draw.redraw();
							}
						} else {
							Draw.tempSelectedVertex = Draw.selectedVertex = null;
							Draw.highlightedEdges = {};
							Draw.pathLock = false;
							Draw.redraw();
							app.updatePathBox();
						}
					}
					break;
				}
			}
			app.canvMousePressed = true;
		},
		canvMouseUp: function(ev) {
			app.canvMousePressed = false;
			switch(app.choosedTool) {
				case "add-edge": {
					if(Draw.tempSelectedVertex !== null && Draw.selectedVertex !== null && Draw.tempSelectedVertex !== Draw.selectedVertex) {
						console.log(Draw.tempSelectedVertex, Draw.selectedVertex);
						app.graph.addEdge(Draw.tempSelectedVertex, Draw.selectedVertex);
						Draw.tempSelectedVertex = Draw.selectedVertex = null;
						Draw.redraw();
					}
					break;
				}
		  }
		},
		canvMouseMove: function(ev) {
			var p = Draw.getCoords(ev.target, ev), v, e;
			switch(app.choosedTool) {
				case "add-vertex": {
					Draw.redraw();
					var tmpid = app.graph.lastVertex;
					Draw.vertex(p, tmpid + 2, Draw.Color.Temp);
					break;
				}
				case "add-edge": {
					v = Draw.getVertexOfPoint(p);
					if(Draw.tempSelectedVertex !== v) {
						Draw.tempSelectedVertex = v;
						Draw.redraw();
						if(Draw.tempSelectedVertex !== null && Draw.selectedVertex !== null && Draw.tempSelectedVertex !== Draw.selectedVertex) {
							console.log(Draw.tempSelectedVertex, Draw.selectedVertex);
							Draw.edge(Draw.tempSelectedVertex, Draw.selectedVertex, Draw.Color.Selected);
						}
					}
					break;
				}
				case "remove-vertex": {
					v = Draw.getVertexOfPoint(p);
					if(Draw.tempSelectedVertex !== v) {
						Draw.tempSelectedVertex = v;
						Draw.redraw();
					}
					break;
				}
				case "remove-edge": {
					v = Draw.getEdgeOfPoint(p);
					if(Draw.tempSelectedEdge.length !== v.length || Draw.tempSelectedEdge[0] !== v[0] || Draw.tempSelectedEdge[1] !== v[1]) {
						Draw.tempSelectedEdge = v;
						Draw.redraw();
					}
					break;
				}
				case "properties": {
					v = Draw.getVertexOfPoint(p);
					Draw.tempSelectedVertex = v;
					Draw.tempSelectedEdge = (v === null) ? Draw.getEdgeOfPoint(p) : [];
					Draw.redraw();
					break;
				}
				case "find-path": {
					if(!Draw.pathLock) {
						v = Draw.getVertexOfPoint(p);
						Draw.tempSelectedVertex = v;
						Draw.redraw();
					}
					break;
				}
			}
			if(app.canvMousePressed) {
				
			}
		},
		/*canvMouseOut: function() {
			Draw.tempSelectedVertex = null;
			Draw.tempSelectedEdge = [];
			Draw.redraw();
		},*/
		toolbarChange: function(ev) {
			var el = ev.target;
			if(el.checked) {
				app.choosedTool = el.id;
				
				Draw.tempSelectedVertex = null;
				Draw.tempSelectedEdge = [];
				Draw.selectedVertex = null;
				Draw.selectedEdge = [];
				Draw.redraw();
				
				app.chooseCursor(el.id);
				
				if(el.id === "properties") {
					app.propBox = new PropertiesBox();
					app.updateProperties();
				} else if(app.propBox !== null) {
					app.propBox.destroy();
					app.propBox = null;
				}
				if(el.id === "find-path") {
					app.pathBox = new PropertiesBox();
					app.updatePathBox();
				} else if(app.pathBox !== null) {
					app.pathBox.destroy();
					app.pathBox = null;
					Draw.pathLock = false;
				}
			}
		}
	};
	this.changeCanvCursor = function(cursor) {
		el.canv.style.cursor = cursor;
	}
	this.chooseCursor = function(tool) {
		var cursor = "";
		switch(tool) {
			case "add-vertex":
			case "add-edge":
				cursor = "copy";
				break;
			case "properties":
				cursor = "help";
				break;
			default:
				cursor = "default";
				break;
		}
		this.changeCanvCursor(cursor);
	}
	this.findElements = function() {
		el.canv = document.getElementById("graph-canv");
		ctx = el.canv.getContext("2d");
		el.toolbar = document.getElementById("toolbar");
		el.selectedItem = document.getElementById("sel-item");
		el.sideBoxCont = document.getElementById("sidebox-cont");
	};
	this.attachEvents = function() {
		el.canv.onmousedown = eventListeners.canvMouseDown;
		el.canv.onmouseup = eventListeners.canvMouseUp;
		el.canv.onmousemove = eventListeners.canvMouseMove;
		el.canv.onmouseout = eventListeners.canvMouseOut;
		el.toolbar.onchange = eventListeners.toolbarChange;
	};
	this.createGraph = function() {
		this.graph = new Graph();
	};
	this.init = function() {
		this.findElements();
		this.attachEvents();
		this.createGraph();
	};
	this.init();
};
var app = new GraphApp();