
# models/subscriber.coffee
# for meavisa.org, by @f03lipe

mongoose = require 'mongoose'

# Schema
SubscriberSchema = new mongoose.Schema {
		email: String
	}, { id: true } # default


# Methods
SubscriberSchema.methods = {}

SubscriberSchema.statics.findOrCreate = findOrCreate

module.exports = mongoose.model "Subscriber", SubscriberSchema