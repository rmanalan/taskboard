window.log = function(){
  log.history = log.history || [];  
  log.history.push(arguments);
  arguments.callee = arguments.callee.caller;  
  if(this.console) console.log( Array.prototype.slice.call(arguments) );
};
(function(b){function c(){}for(var d="assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","),a;a=d.pop();)b[a]=b[a]||c})(window.console=window.console||{});

// Spine Local Storage
Spine.Model.Local = {
  extended: function(){
    this.sync(this.proxy(this.saveLocal));
    this.fetch(this.proxy(this.loadLocal));
  },
    
  saveLocal: function(){
    var result = JSON.stringify(this);
    localStorage[this.name] = result;
  },

  loadLocal: function(){
    var result = localStorage[this.name];
    if ( !result ) return;
    var result = JSON.parse(result);
    this.refresh(result);
  }
};


// Spine Ajax
(function(Spine, $){
  
var Model = Spine.Model;
var Ajax  = Spine.Ajax = {
  getUrl: function(object){
    if (!(object && object.url)) return null;
    return((typeof object.url == "function") ? object.url() : object.url);
  },

  methodMap: {
    "create":  "POST",
    "update":  "PUT",
    "destroy": "DELETE",
    "read":    "GET"
  },

  send: function(record, method, params){ 
    params = $.extend(params || {}, {
      type:          this.methodMap[method],
      contentType:  "application/json",
      dataType:     "json",
      data:         {}
    });
    
    if (method == "create" && record.model)
      params.url = this.getUrl(record.parent);
    else
      params.url = this.getUrl(record);

    if ( !params.url ) throw("Invalid URL");
    
    if (method == "create" || method == "update") {
      var data = {};
    
      if (record.parent.ajaxPrefix) {
        data = {};
        data[record.parent.ajaxPrefix] = record;
      } else {
        data = record;
      }
      data = $.extend(data, params.data);
      params.data = JSON.stringify(data);
      params.processData = false;
    
      params.success = function(data, status, xhr){
        if ( !data ) return;
      
        // Simple deep object comparison
        if (JSON.stringify(record) == JSON.stringify(data)) return;
      
        // ID change, need to do some shifting
        if (data.id && record.id != data.id) {
          var records      = record.parent.records;
          records[data.id] = records[record.id];
          delete records[record.id];
          record.id        = data.id;
        }
      
        // Update with latest data
        Ajax.noSync(function(){ 
          record.updateAttributes(data); 
        });
      
        record.trigger("ajaxSuccess", record, status, xhr);
      };
    }
  
    if (method == "read" && !params.success)
      params.success = function(data){
       (record.refresh || record.load).call(record, data);
      };
  
    var success = params.success;
    params.success = $.proxy(function(){
      if (success) success.apply(this, arguments);
      this.sendNext();
    }, this);
  
    params.error = function(xhr, s, e){
      record.trigger("ajaxError", record, xhr, s, e);
    };
  
    $.ajax(params);
  },
  
  enabled:  true,
  pending:  false,
  requests: [],
  
  noSync: function(callback){
    this.enabled = false;
    callback()
    this.enabled = true;
  },

  sendNext: function(){
    var next = this.requests.shift();
    if (next) {
      this.send.apply(this, next);
    } else {
      this.pending = false;
    }
  },

  ajaxSync: function(){
    if ( !this.enabled ) return;
    if (this.pending) {
      this.requests.push(arguments);
    } else {
      this.pending = true;
      this.send.apply(this, arguments);
    }
  }
};

Model.Ajax = {
  extended: function(){
    this.sync(function(){
      Ajax.ajaxSync.apply(Ajax, arguments);
    });
    this.fetch(this.proxy(function(params){
      Ajax.ajaxSync(this, "read", params);
    }));
  }
};

Model.extend({
  ajaxPrefix: false,
  
  url: function() {
    return "/" + this.name.toLowerCase() + "s"
  }
});

Model.include({
  url: function(){
    var base = Ajax.getUrl(this.parent);
    base    += (base.charAt(base.length - 1) == "/" ? "" : "/");
    base    += encodeURIComponent(this.id);
    return base;        
  }  
});

})(Spine, Spine.$);

// Spine Routes
// Spine routing, based on Backbone's implementation.
//  Backbone.js 0.3.3
//  (c) 2010 Jeremy Ashkenas, DocumentCloud Inc.
//  Backbone may be freely distributed under the MIT license.
//  For all details and documentation:
//  http://documentcloud.github.com/backbone
//
// For usage, see examples/route.html

(function(Spine, $){  
  var Route = Spine.Route = Spine.Class.create();
  
  var hashStrip = /^#*/;
  
  Route.extend({
    routes: [],
    
    historySupport: ("history" in window),
    history: false,
        
    add: function(path, callback){
      if (typeof path === "object")
        for(var p in path) this.add(p, path[p]);
      else
        this.routes.push(this.init(path, callback));
    },
    
    setup: function(options){
      if (options && options.history)
        this.history = this.historySupport && options.history;
        
      if ( this.history )
        $(window).bind("popstate", this.change);
      else
        $(window).bind("hashchange", this.change);
      this.change();
    },
    
    unbind: function(){
      if (this.history)
        $(window).unbind("popstate", this.change);
      else
        $(window).unbind("hashchange", this.change);
    },
    
    navigate: function(){
      var args = Spine.makeArray(arguments);
      var triggerRoutes = true;
      
      if (typeof args[args.length - 1] === "boolean") {
        triggerRoutes = args.pop();
      }
      
      var path = args.join("/");      
      if (this.path === path) return;
      
      if ( !triggerRoutes )
        this.path = path;
      
      if (this.history)
        history.pushState({}, 
          document.title, 
          this.getHost() + path
        );
      else
        window.location.hash = path;
    },
    
    // Private
    
    getPath: function(){
      return window.location.pathname;
    },
    
    getHash: function(){
      return window.location.hash;
    },
    
    getHost: function(){
      return((document.location + "").replace(
        this.getPath() + this.getHash(), ""
      ));
    },
    
    getFragment: function(){
      return this.getHash().replace(hashStrip, "");
    },
    
    change: function(e){
      var path = (this.history ? this.getPath() : this.getFragment());
      if (path === this.path) return;
      this.path = path;
      for (var i=0; i < this.routes.length; i++)
        if (this.routes[i].match(path)) return;
    }
  });
  
  Route.proxyAll("change");
  
  var namedParam   = /:([\w\d]+)/g;
  var splatParam   = /\*([\w\d]+)/g;
  var escapeRegExp = /[-[\]{}()+?.,\\^$|#\s]/g;

  Route.include({    
    init: function(path, callback){
      this.callback = callback;
      if (typeof path === "string") {      
        path = path.replace(escapeRegExp, "\\$&")
                   .replace(namedParam, "([^\/]*)")
                   .replace(splatParam, "(.*?)");
                       
        this.route = new RegExp('^' + path + '$');
      } else {
        this.route = path;
      }
    },
    
    match: function(path){
      var match = this.route.exec(path)
      if ( !match ) return false;
      var params = match.slice(1);
      this.callback.apply(this.callback, params);
      return true;
    }
  });
  
  Spine.Controller.fn.route = function(path, callback){
    Spine.Route.add(path, this.proxy(callback));
  };
  
  Spine.Controller.fn.routes = function(routes){
    for(var path in routes)
      this.route(path, routes[path]);
  };
  
  Spine.Controller.fn.navigate = function(){
    Spine.Route.navigate.apply(Spine.Route, arguments);
  };
})(Spine, Spine.$);


// String to slug
String.prototype.toSlug = function() {
  str = this.replace(/^\s+|\s+$/g, ''); // trim
  str = str.toLowerCase();
  
  // remove accents, swap ñ for n, etc
  var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
  var to   = "aaaaeeeeiiiioooouuuunc------";
  for (var i=0, l=from.length ; i<l ; i++) {
    str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  str = str.replace(/[^a-z0-9 \-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  return str;
};

