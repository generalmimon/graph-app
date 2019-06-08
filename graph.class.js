var Graph = function() {
	this.lastVertex = -1;
	this.vertexList = {};
	this.edgeValueList = {};
};
Graph.prototype.isAdjacent = function(a, b) {
	var list = this.vertexList[a].adjacent;
	if(list.indexOf(b) !== -1) {
		return true;
	}
	return false;
};
Graph.prototype.getNeighbours = function(a) {
	return this.vertexList[a].adjacent.slice(0);// copy the adjacency list for a
};
Graph.prototype.addVertex = function() {
	this.vertexList[++this.lastVertex] = {adjacent: []};
	return this.lastVertex;
};
Graph.prototype.findLastVertex = function() {
	var lastVertex = -1;
	for(var i in this.vertexList) {
		if(this.vertexList.hasOwnProperty(i)) {
			i = Number(i);
			if(i > lastVertex) {
				lastVertex = i;
			}
		}
	}
	return lastVertex;
};
Graph.prototype.removeVertex = function(a) {
	var nbrs = this.getNeighbours(a);
	for(var i = 0, nbrlen = nbrs.length; i < nbrlen; i++) {
		this.removeEdge(a, nbrs[i]);
	}
	var delResult = (delete this.vertexList[a]);
	if(a === this.lastVertex) {
		this.lastVertex = this.findLastVertex();
	}
	return delResult;
};
Graph.prototype.addEdge = function(a, b) {
	if(!this.isAdjacent(a, b)) {
		this.vertexList[a].adjacent.push(b);
		this.vertexList[b].adjacent.push(a);
		return true;
	}
	return false;
};
Graph.prototype.removeEdge = function(a, b) {
	if(this.isAdjacent(a, b)) {
		var aIdx = this.vertexList[b].adjacent.indexOf(a),
			bIdx = this.vertexList[a].adjacent.indexOf(b);
		this.vertexList[a].adjacent.splice(bIdx, 1);
		this.vertexList[b].adjacent.splice(aIdx, 1);
		this.deleteEdgeValue(a, b);
		return true;
	}
	return false;
};
Graph.prototype.getVertexValue = function(a) {
	if(this.vertexList.hasOwnProperty(a) && this.vertexList[a].hasOwnProperty("value")) {
		return this.vertexList[a].value;
	}
	return "";
};
Graph.prototype.setVertexValue = function(a, value) {
	this.vertexList[a].value = value;
	return true;
};
Graph.prototype.getEdgeValue = function(a, b) {
	var newA = Math.min(a, b),
		newB = Math.max(a, b);
	if(
		this.edgeValueList.hasOwnProperty(newA) &&
		this.edgeValueList[newA].hasOwnProperty(newB)
	) {
		return this.edgeValueList[newA][newB];
	}
	return 1;
};
Graph.prototype.setEdgeValue = function(a, b, value) {
	var newA = Math.min(a, b),
		newB = Math.max(a, b);
	if(!this.edgeValueList.hasOwnProperty(newA)) {
		this.edgeValueList[newA] = {};
	}
	this.edgeValueList[newA][newB] = Number(value);
};
Graph.prototype.deleteEdgeValue = function(a, b) {
	var newA = Math.min(a, b),
		newB = Math.max(a, b);
	if(this.edgeValueList.hasOwnProperty(newA)) {
		return (delete this.edgeValueList[newA][newB]);
	}
	return true;
};
Graph.prototype.getVertexCount = function() {
	var vertexCount = 0;
	for(var i in this.vertexList) {
		if(this.vertexList.hasOwnProperty(i)) {
			vertexCount++;
		}
	}
	return vertexCount;
};
Graph.prototype.getEdgeCount = function() {
	var edgeCount = 0;
	var countedEdges = {},
		nbrs,
		edgeMissing = false;
	for(var i in this.vertexList) {
		if(this.vertexList.hasOwnProperty(i)) {
			i = Number(i);
			nbrs = this.getNeighbours(i);
			for(var j = 0, nlen = nbrs.length; j < nlen; j++) {
				var a = Math.min(i, nbrs[j]),
					b = Math.max(i, nbrs[j]);
				edgeMissing = false;
				if(!countedEdges.hasOwnProperty(a)) {
					countedEdges[a] = {};
					edgeMissing = true;

				}
				if(!countedEdges[a].hasOwnProperty(b)) {
					countedEdges[a][b] = true;
					edgeMissing = true;
				}
				if(edgeMissing) {
					edgeCount++;
				}
			}
		}
	}
	return edgeCount;
}
Graph.prototype.Dijkstra = function(a, b) {
	var unvisited = [],
		distance = {},
		previous = {};
	function getVertexWithMinDist(unvisited, distance) {
		var minDist = Infinity, dist, v;
		for(var t = 0, tlen = unvisited.length; t < tlen; t++) {
			dist = distance[unvisited[t]];
			if(dist <= minDist) {// operátor <= je tu proto, aby to fungovalo i pro vrcholy, ke kterým nevede žádná cesta od startu
				minDist = dist;
				v = t;
			}
		}
		return v;
	}
	for(var i in this.vertexList) {
		i = Number(i);
		distance[i] = Infinity;
		previous[i] = undefined;
		unvisited.push(i);
	}
	distance[a] = 0;
	while(unvisited.length > 0) {
		var uIdx = getVertexWithMinDist(unvisited, distance),
			u = unvisited[uIdx],
			neighbours = this.getNeighbours(u);
		unvisited.splice(uIdx, 1);
		for(var i = 0, ilen = neighbours.length, v; i < ilen; i++) {
			v = neighbours[i];
			var alt = distance[u] + this.getEdgeValue(u, v);
			if(alt < distance[v]) {
				distance[v] = alt;
				previous[v] = u;
			}
		}
	}
	var s = [],
		u = b;
	s.unshift(u);
	while((u = previous[u]) !== undefined) {
		s.unshift(u);
	}
	return {d: distance[b], s: s};
};
