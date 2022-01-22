import * as mongoose from 'mongoose';

export const Query = mongoose.model('query', {
    product: String,
    minPrice: Number,
    maxPrice: Number
});

export const Result = mongoose.model('result', {
    id: String,
    product: String,
    oldPrice: Number,
    discount: Number, // in percent
    newPrice: Number,
    shop: String,
    url: String
});

export const DeviceId = mongoose.model('deviceId', {
    deviceId: String
});