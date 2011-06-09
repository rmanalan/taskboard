window.log = function(){
  log.history = log.history || [];  
  log.history.push(arguments);
  arguments.callee = arguments.callee.caller;  
  if(this.console) console.log( Array.prototype.slice.call(arguments) );
};
(function(b){function c(){}for(var d="assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","),a;a=d.pop();)b[a]=b[a]||c})(window.console=window.console||{});

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

