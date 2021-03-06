(function() {
	"use strict";

	var root = typeof self === "object"?self:global;

	var Ajax = function(url, verb) {
		this.req = new XMLHttpRequest();
		this.req_verb = (verb === undefined)?"get":verb;
		this.url = (url === undefined)?root.location.href:url;
		this.parse_json = true;
		this.req_body = null;
		return this;
	};

	Ajax.prototype.send = function(callback) {
		var self = this;//fixes the issues of "this" scope
		var promise = (callback === undefined)?true:false;

		self.req.open(self.req_verb, self.url, true);
		
		//Headers can only be set after open() is called
		if(self.set_headers !== undefined) {
			var keys = Object.keys(self.set_headers);
			for (var i = 0; i < keys.length; i++) {
				self.req.setRequestHeader(keys[i], self.set_headers[key[i]]);
			}
		}

		if (self.req_body) {
			self.req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			self.req.setRequestHeader("Content-length", self.req_body.length);
			self.req.setRequestHeader("Connection", "close");
		}

		var parse_json = self.parse_json;
		if (promise) {	
			return new Promise(function(resolve, reject) {
				self.req.onload = function() {
					var res = (this.response === undefined)?this.responseText:this.response;
					if (parse_json === true) {
						//Promises can only ever take a single argument
						return resolve(JSON.parse(res));
					} else {
						return resolve(res);
					}
				};
				self.req.onerror = function() {
					//TODO: more info to reject than just the status?
					return reject(this.status);
				};
				self.req.send(self.req_body);
			});
		} else {
			this.req.onload = function() {
				//Old IE doesn't support the .response property, or .getAllResponseHeaders()
				var res = (this.response === undefined)?this.responseText:this.response;
				var headers = (this.getAllResponseHeaders === undefined)?"":this.getAllResponseHeaders();
				if (parse_json === true) {
					callback(JSON.parse(res), this.status, this.getAllResponseHeaders());
				} else {
					callback(res, this.status, headers);
				}
			};
			self.req.send(self.req_body);
		}
	};

	Ajax.prototype.vars = function(vars) {
		this.url_var = "";
		var keys = Object.keys(vars);
		for (var i = 0; i < keys.length; i++) {
			if (i > 0) this.url_var += "&";
			this.url_var += encodeURIComponent(keys[i]) + "=" + encodeURIComponent(vars[keys[i]]);
		}
		this.url += "?" + this.url_var;
		return this;
	};

	Ajax.prototype.raw = function(bool) {
		this.parse_json = (bool === undefined)?false:bool;
		return this;
	};

	Ajax.prototype.headers = function(headers) {
		this.set_headers = headers;
		return this;
	};

	Ajax.prototype.data = function(data) {
		var body = "";
		var keys = Object.keys(data);
		for (var i = 0; i < keys.length; i++) {
			if (i > 0) body += "&";
			body += encodeURIComponent(keys[i]) + "=" + encodeURIComponent(data[keys[i]]);
		}
		this.req_body = body;
		return this;
	};

	Ajax.prototype.progress = function(callback) {
		this.req.addEventListener("progress", callback, false);
		return this;
	};

	Ajax.prototype.error = function(callback) {
		this.req.addEventListener("error", callback, false);
		return this;
	};

	//export as a commonjs compatible module, or as a global function in the browser
	if (typeof module !== "undefined" && module.exports) {
		module.exports = function(url, verb) {
			return new Ajax(url, verb);
		}
	} else {
		if (typeof root.ajax === "undefined") {
			root.ajax = function(url, verb) {
				return new Ajax(url, verb);
			}
		}
	}

	//also export for AMDjs
	if (typeof define === "function" && define.amd) {
		define({
			ajax: function(url, verb) {
				return new Ajax(url, verb);
			}
		});
	}
})();
