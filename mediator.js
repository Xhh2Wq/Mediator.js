/*! 
* Mediator.js Library v0.5.0
* https://github.com/ajacksified/Mediator.js
*
* Copyright 2011, Jack Lawson
* MIT Licensed (http://www.opensource.org/licenses/mit-license.php)
*
* For more information: http://www.thejacklawson.com/index.php/2011/06/mediators-for-modularized-asynchronous-programming-in-javascript/
* Project on GitHub: https://github.com/ajacksified/Mediator.js
*
* Last update: Sep 15 2011
*/

(function(){
  function guidGenerator() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
  }
 
  function Subscriber(fn, options, context){
    if (!this instanceof Subscriber) {
      return new Subscriber(fn, context, options);
    }else{
      this.id = guidGenerator();
      this.fn = fn;
      this.options = options;
      this.context = context;
    }
  };

  Subscriber.prototype = {
    Update: function(options){
      if(options){
        this.fn = options.fn || this.fn;
        this.context = options.context || this.context;
        this.options = options.options || this.options;
      }
    }
  };

  function Channel(){
    if (!this instanceof Channel) {
      return new Channel();
    }else{
      this._callbacks = [];
      this._channels = [];
    }
  };

  Channel.prototype = {
    AddSubscriber: function(fn, options, context){
      var callback = new Subscriber(fn, options, context);

      if(options && options.priority !== undefined){
        options.priority = options.priority >> 0;
        
        if(options.priority < 0) options.priority = 0;
        if(options.priority > this._callbacks.length) options.priority = this._callbacks.length;

        this._callbacks.splice(options.priority, 1, callback);
      }else{
        this._callbacks.push(callback);
      }

      return callback;
    },

    GetSubscriber: function(identifier){
      for(var x = 0, y = this._callbacks.length; x < y; x++){
        if(this._callbacks[x].id == identifier || this._callbacks[x].fn == identifier){
          return this._callbacks[x];
        }
      }
      
      for(var z in this._channels){
        if(this._channels.hasOwnProperty(z)){
          var sub = this._channels[z].GetSubscriber(identifier);
          if(sub !== undefined){
            return sub;
          } 
        }
      }
    },

    SetPriority: function(identifier, priority){
      var oldIndex = 0;

      for(var x = 0, y = this._callbacks.length; x < y; x++){
        if(this._callbacks[x].id == identifier || this._callbacks[x].fn == identifier){
          break;
        }
        oldIndex ++;
      }

      var sub = this._callbacks[oldIndex],
          firstHalf = this._callbacks.slice(0, oldIndex),
          lastHalf = this._callbacks.slice(oldIndex+1, this._callbacks.length-oldIndex);

      this._callbacks = firstHalf.concat(lastHalf);
      this._callbacks.splice(priority, 0, sub);

    },

    AddChannel: function(channel){
      this._channels[channel] = new Channel();
    },

    HasChannel: function(channel){
      return this._channels.hasOwnProperty(channel);
    },

    ReturnChannel: function(channel){
      return this._channels[channel];
    },

    RemoveSubscriber: function(identifier){
      if(!identifier){
        this._callbacks = []; 
        
        for(var z in this._channels){
          if(this._channels.hasOwnProperty(z)){
            this._channels[z].RemoveSubscriber(identifier);
          }
        }
      }

      for(var y = 0, x = this._callbacks.length; y < x; y++) {
        if(this._callbacks[y].fn == identifier || this._callbacks[y].id == identifier){
          this._callbacks.splice(y,1);
          x--; y--;
        }
      }
    },

    Publish: function(data){
      for(var y = 0, x = this._callbacks.length; y < x; y++) {
        var callback = this._callbacks[y];

        if(callback.options !== undefined && typeof callback.options.predicate === "function"){
          if(callback.options.predicate.apply(callback.context, data)){
            callback.fn.apply(callback.context, data);
          } 
        }else{
          callback.fn.apply(callback.context, data);
        }
      }

      for(var x in this._channels){
        if(this._channels.hasOwnProperty(x)){
          this._channels[x].Publish(data);
        }
      }
    }
  };
  
  function Mediator() {
    if (!this instanceof Mediator) {
      return new Mediator();
    }else{
      this._channels = new Channel();
    }
  };

  Mediator.prototype = {
    GetChannel: function(namespace){
      var channel = this._channels;
      var namespaceHeirarchy = namespace.split(':');

      if(namespace === ''){
        return channel;
      }
      
      if(namespaceHeirarchy.length > 0){
        for(var i = 0, j = namespaceHeirarchy.length; i < j; i++){

          if(!channel.HasChannel(namespaceHeirarchy[i])){
            channel.AddChannel(namespaceHeirarchy[i]);
          }
          
          channel = channel.ReturnChannel(namespaceHeirarchy[i]);
        }
      }
      
      return channel;
    },

    Subscribe: function(channelName, fn, options, context){
      var options = options || {},
          context = context || {},
          channel = this.GetChannel(channelName),
          sub = channel.AddSubscriber(fn, options, context);

      return sub;
    },

    GetSubscriber: function(identifier, channel){
      return this.GetChannel(channel || "").GetSubscriber(identifier);
    },

    Remove: function(channelName, fn){
      this.GetChannel(channelName).RemoveSubscriber(fn);
    },
    
    Publish: function(channelName){
      this.GetChannel(channelName).Publish(Array.prototype.slice.call(arguments, 1));
    }
  };

  window.Mediator = Mediator;
  Mediator.Channel = Channel;
  Mediator.Subscriber = Subscriber;
})(window);

