import 'reflect-metadata';
import { BehaviorSubject } from 'rxjs';

const persistMetadataKey = Symbol('persist');

class PersistPropertyMetaData {
    constructor(
        public storageKey: string,
        public autoStore: boolean,
        serialize?: (obj: any) => Promise<string>,
        deserialize?: (serialized: string) => Promise<any>
    ) {
        if (serialize) {
            this.serialize = serialize;
        }
        if (deserialize) {
            this.deserialize = deserialize;
        }
    }

    async serialize(obj: any): Promise<string> {
        if (obj instanceof BehaviorSubject) {
            obj = <BehaviorSubject<any>>obj.getValue();
        }
        if (obj instanceof Map) {
            return JSON.stringify(Array.from(obj.entries()));
        } else if (obj instanceof Set) {
            return JSON.stringify(Array.from(obj));
        } else {
            return JSON.stringify(obj);
        }
    }

    async deserialize(serialized: string, propVal: any): Promise<any> {
        if (!serialized) {
            return null;
        }
        if (propVal instanceof BehaviorSubject) {
            propVal = <BehaviorSubject<any>>propVal.getValue();
        }
        if (propVal instanceof Map) {
            return new Map(JSON.parse(serialized));
        } else if (propVal instanceof Set) {
            return new Set(JSON.parse(serialized));
        } else {
            return JSON.parse(serialized);
        }
    }
}

export abstract class LocalStorage {
    // Have to have an init method to get the right 'this' scope
    init() {
        const self = this;
        for (const [p, m] of Array.from(this.persistProps.entries())) {
            const propVal = Reflect.get(self, p);
            if (m.autoStore && propVal instanceof BehaviorSubject) {
                let initialized = false;
                propVal.subscribe(newVal => {
                    if (initialized) {
                        this.storeOne(p);
                    } else {
                        initialized = true;
                    }
                });
            }
        }
    }

    private get persistProps(): Map<string, PersistPropertyMetaData> {
        return Reflect.getMetadata(persistMetadataKey, this);
    }

    async storeOne(propName: string) {
        const propMetaData: PersistPropertyMetaData = this.persistProps.get(propName);
        localStorage.setItem(propMetaData.storageKey, await propMetaData.serialize(Reflect.get(this, propName)));
    }

    async store() {
        const promises = [];
        Array.from(this.persistProps.keys())
            .filter(p => Reflect.has(this, p))
            .forEach(p => {
                promises.push(this.storeOne(p));
            });
        await Promise.all(promises);
    }

    async restore() {
        for (const [prop, propMetaData] of Array.from(this.persistProps.entries())) {
            const propVal = Reflect.get(this, prop);
            const storageVal = localStorage.getItem(propMetaData.storageKey);
            if (!storageVal) {
                continue;
            }
            const restoredVal = await propMetaData.deserialize(storageVal, propVal);
            if (typeof restoredVal !== 'boolean' && !restoredVal) {
                continue;
            }
            if (propVal instanceof BehaviorSubject) {
                (<BehaviorSubject<any>>propVal).next(restoredVal);
            } else {
                Reflect.set(this, prop, restoredVal ? restoredVal : Reflect.get(this, prop));
            }
        }
    }
}

export function persist(
    key?: string,
    prefix?: string,
    autoStore: boolean = true,
    serialize?: (obj: any) => Promise<string>,
    deserialize?: (serialized: string) => Promise<any>
): any {
    return (obj: any, propertyName: string) => {
        let persistProps: Map<string, PersistPropertyMetaData>;
        if (Reflect.hasMetadata(persistMetadataKey, obj)) {
            persistProps = Reflect.getMetadata(persistMetadataKey, obj);
        } else {
            persistProps = new Map();
        }
        // Prefix storage keys with class name or custom prefix (null prefix means no prefix)
        let unprefixedKey: string = key ? key : propertyName;
        if (unprefixedKey.endsWith('$')) {
            unprefixedKey = unprefixedKey.substr(0, unprefixedKey.length - 1);
        }
        prefix = prefix === null ? '' : (prefix ? prefix : obj.constructor.name) + '.';
        const storageKey = prefix + unprefixedKey;
        persistProps.set(propertyName, new PersistPropertyMetaData(storageKey, autoStore, serialize, deserialize));
        Reflect.defineMetadata(persistMetadataKey, persistProps, obj);
    };
}