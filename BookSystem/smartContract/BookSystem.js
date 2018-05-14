"use strict";

var Author = function(text) {
    if (text) {
        var obj = JSON.parse(text);
        this.name = obj.name;
        this.desc = obj.desc;
        this.photos = obj.photos;
        this.from = obj.from;
    } else {
        this.name = "";
        this.desc = "";
        this.photos = "";
        this.from = "";
    }
};

Author.prototype = {
    toString: function() {
        return JSON.stringify(this);
    }
};

var Book = function(text){
    if (text) {
        var obj = JSON.parse(text);
        this.id = obj.id;
        this.name = obj.name;
        this.desc = obj.desc;
        this.author = obj.author;
        this.author_addr = obj.author_addr;
        this.state = obj.state;
        this.chapter_num = obj.chapter_num;
    } else {
        this.id = 0;
        this.name = "";
        this.desc = "";
        this.author = "";
        this.author_addr = obj.author_addr;
        this.state = "";
        this.chapter_num = 0;
    }
};

Book.prototype = {
    toString: function() {
        return JSON.stringify(this);
    }
};

var BookChapter = function(text){
    if (text) {
        var obj = JSON.parse(text);
        this.index = obj.index;
        this.name = obj.name;
        this.price = obj.price;
    } else {
        this.index = 0;
        this.name = "";
        this.price = 0;
    }
};

BookChapter.prototype = {
    toString: function() {
        return JSON.stringify(this);
    }
};

var SubscribeInfo = function(text){
    if (text) {
        var obj = JSON.parse(text);
        this.indexes = obj.indexes;

    } else {
        this.indexes = "[]";
    }
};

SubscribeInfo.prototype = {
    toString: function() {
        return JSON.stringify(this);
    }
};

var BookSystem = function() {
    LocalContractStorage.defineProperty(this, "size");
    LocalContractStorage.defineMapProperty(this, "authorNameMap");
    LocalContractStorage.defineMapProperty(this, "authorMap", {
        parse: function(text) {
            return new Author(text);
        },
        stringify: function(o) {
            return o.toString();
        }
    });

    LocalContractStorage.defineMapProperty(this, "bookIdMap");
    LocalContractStorage.defineMapProperty(this, "bookChapter");
    LocalContractStorage.defineMapProperty(this, "chapterContent");
    LocalContractStorage.defineMapProperty(this, "bookMap", {
        parse: function(text) {
            return new Book(text);
        },
        stringify: function(o) {
            return o.toString();
        }
    });

    LocalContractStorage.defineMapProperty(this, "subscribeMap"); 
};

BookSystem.prototype = {
    init: function() {
        // todo
        this.size = 0;
    },

    size: function() {
        return this.size;
    },

    register_author:function(info) {//注册作者
        var from = Blockchain.transaction.from;
        if(this.authorMap.get(from) != null){
            throw new Error("你已经注册过了，请不要重复注册！");
        }

        var author = new Author(info);

        author.name = author.name.trim();
        if(author.name == ""){
            throw new Error("笔名不能为空");
        }

        if(this.authorNameMap.get(author.name) != null){
            throw new Error("笔名重复了，请更换笔名！");
        }

        author.from = from;
        this.authorNameMap.put(author.name, from);
        this.authorMap.put(from, author);
    },

    new_book:function(info){//新建书箱
        var from = Blockchain.transaction.from;
        var author = this.authorMap.get(from);
        if(author == null){
            throw new Error("请先注册成为作者再发布作品！");
        }

        var book = new Book(info);
        book.name = book.name.trim();
        if(book.name == ""){
            throw new Error("书名不能为空");
        }

        if(this.bookMap.get(book.name) != null){
            throw new Error("书名重复了，请更换书名！");
        }

        this.size += 1;
        book.id = this.size;
        book.chapter_num = 0;
        book.author = author.name;
        book.state = "新上传";
        book.author_addr = from;
        this.bookMap.put(book.name, book);
        this.bookIdMap.put(book.id, book.name);
    },

    release_chapter: function(id, name, content, price) {//发布章节
        //发布章节
        var from = Blockchain.transaction.from;
        
        var author = this.authorMap.get(from);
        if(author == null){
            throw new Error("请先注册成为作者再发布作品！");
        }

        var book_name = this.bookIdMap.get(id);
        if(book_name == null){
            throw new Error("作品不存在！");
        }

        name = name.trim();

        if(name == ""){
            throw new Error("章节名不能为空");
        }

        if(content == ""){
            throw new Error("章节内家不能为空");
        }

        var book = this.bookMap.get(book_name);
        if(book.author != author.name){
            throw new Error("你不是该作品的作者！");
        }

        book.chapter_num += 1;
        this.bookMap.set(book_name, book);

        
        var chapter = new BookChapter();
        chapter.index = book.chapter_num;
        chapter.name = name;
        chapter.price = new BigNumber(price);
        var key = id + "_" + chapter.index;
        this.bookChapter.put(key, chapter);
        this.chapterContent.put(key, content);
    },

    get_books: function(limit, offset){
        limit = parseInt(limit);
        offset = parseInt(offset);
        if(offset >= this.size){
           throw new Error("offset is not valid");
        }
  
        var result = {
            have_more:true,
            data: new Array(),
        }
        var count = 0;
        var i = offset+1;
        for(; i <= this.size && count < limit; i++){
            var name = this.bookIdMap.get(i);
            var object = this.bookMap.get(name);
            result.data.push(object);
            count++;
        }

        if(i == this.size){
            result.have_more = false;
        }

        return result;
    },

    chapter_list: function(id){
        id = parseInt(id);

        var book_name = this.bookIdMap.get(id);
        if(book_name == null){
            throw new Error("作品不存在！");
        }

        var book = this.bookMap.get(book_name);

        var result = new Array();
        for(var i = 1; i <= book.chapter_num;  i++){
            var key = id + "_" + i;
            var object = this.bookChapter.get(key);
            result.data.push(object);
        }
        return result;
    },

    get_chapter: function(id, index){
        id = parseInt(id);
        index = parseInt(index);

        var book_name = this.bookIdMap.get(id);
        if(book_name == null){
            throw new Error("作品不存在！");
        }

        var from = Blockchain.transaction.from;
        
        var key = id + "_" + index;
        var book = this.bookMap.get(book_name);
        if(book.author_addr == from){
            return this.chapterContent.get(key);
        }else{

        }
    },

    subscribe_chapter: function(id, index){
        id = parseInt(id);
        index = parseInt(index);

        var book_name = this.bookIdMap.get(id);
        if(book_name == null){
            throw new Error("作品不存在！");
        }

        var from = Blockchain.transaction.from;
        var key = from + "_" + id;
        var subscribeInfo = this.subscribeMap.get(key);
        if(subscribeInfo == null){
            throw new Error("作品不存在！");
        }

        if(subscribeInfo.indexes._has(index)){
            throw new Error("你已经订阅过该章节！");
        }

        key = id + "_" + index;
        var value = Blockchain.transaction.value;
        var object = this.bookChapter.get(key);
        if(object.price){
            
        }
    },
};
module.exports = BookSystem;