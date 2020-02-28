var mongoose = require('mongoose');
var Schema = mongoose.Schema;

userSchema = new Schema( {
	name:String,
    handle: String,
    password: String,
    mobile:String,
    email:String,
    friends:[]
}),
userSchema.methods.validPassword = function( pwd ) {
    
    return ( this.password === pwd );
};
User = mongoose.model('User', userSchema);

module.exports = User;


module.exports.online=mongoose.model('online',new Schema({
    handle:String,
    connection_id:String
}));
module.exports.messages=mongoose.model('message',new Schema({
    message : String,
    sender  : String,
    reciever: String,
    date    : Date
}));

module.exports.groupmsg=mongoose.model('groupmsg',new Schema({
    message : String,
    sender  : String,
    date    : Date
}));