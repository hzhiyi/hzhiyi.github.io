"use strict";

var Item = function(text) {
    if (text) {
        var obj = JSON.parse(text);
        this.id = obj.id;
        this.name = obj.name;
        this.sex = obj.sex;
        this.birth = obj.birth;
        this.height = obj.height;
        this.weight = obj.weight;
		this.place = obj.place;
        this.desc = obj.desc;
        this.photos = obj.photos;
        this.contact = obj.contact;
        this.time = obj.time;
    } else {
        this.id = -1;
        this.name = "";
        this.sex = "";
        this.birth = "";
        this.height = "";
        this.weight = "";
		this.place = "";
        this.desc = "";
        this.photos = "";
        this.contact = "";
        this.time = "";
    }
};

Item.prototype = {
    toString: function() {
        return JSON.stringify(this);
    }
};

var User = function(text){
    if (text) {
        var obj = JSON.parse(text);
        this.state = obj.state;
        this.author = obj.author;

    } else {
        this.state = 0;
        this.author = "[]";
    }
};

User.prototype = {
    toString: function() {
        return JSON.stringify(this);
    }
};

var BlindDate = function() {
    LocalContractStorage.defineMapProperty(this, "arrayMap");
    LocalContractStorage.defineProperty(this, "size");
    LocalContractStorage.defineMapProperty(this, "dataMap", {
        parse: function(text) {
            return new Item(text);
        },
        stringify: function(o) {
            return o.toString();
        }
    });

    LocalContractStorage.defineMapProperty(this, "userMap", {
        parse: function(text) {
            return new User(text);
        },
        stringify: function(o) {
            return o.toString();
        }
    });
};

BlindDate.prototype = {
    init: function() {
        // todo
        this.size = 0;
    },

    size: function() {
        return this.size;
    },

    release: function(info) {
        //发布信息
        var from = Blockchain.transaction.from;
        
        var item = new Item(info);
            
        if(this.dataMap.get(from) != null){
            var old = this.dataMap.get(from);
            item.id = old.id;
            item.time = old.getTime();
            this.dataMap.put(from, item); 
        }
        else{
            var index = this.size;
            item.id = index;
            item.time = new Date().getTime();
            this.arrayMap.set(index, from);
            this.dataMap.put(from, item);
            this.size +=1;
        } 
    },

    get: function(limit, offset){
        limit = parseInt(limit);
        offset = parseInt(offset);
        if(offset>this.size){
           throw new Error("offset is not valid");
        }
        var from = Blockchain.transaction.from;
        var result = {
            have_more:true,
            data: new Array(),
        }
        var count = 0;
        var i = offset;
        for(; i < this.size && count < limit; i++){
            var key = this.arrayMap.get(i);

            if(key == null){
                //被删除
                continue;
            }

            var object = this.dataMap.get(key);

            var user = this.userMap.get(key);
            if(user != null && user.author._has(from)){
                //do nothing
            }
            else{
                object.contact = "***";
            }
            result.data.push(object);
            count++;
        }

        if(i == this.size){
            result.have_more = false;
        }

        return result;
    },

    del:  function(){
         //删除信息
         var from = Blockchain.transaction.from;
         if(this.dataMap.get(from) != null){
            var item = this.dataMap.get(from);
            this.dataMap.del(from);
            this.arrayMap.del(item.id);
        }
    },
};
module.exports = BlindDate;