import { LocalStorage, persist } from "./localstorage";
import { BehaviorSubject, Observable } from "rxjs";

export class ConfigData extends LocalStorage {

    private _ready$ = new BehaviorSubject<boolean>(false);

    @persist()
    private _deviceToken$ = new BehaviorSubject(null);
    @persist()
    private _serverAddress$ = new BehaviorSubject(null);
    @persist()
    private _searchInterval$ = new BehaviorSubject<number>(null);
    @persist()
    private _searchApi$ = new BehaviorSubject<string>('');

    constructor() {
        super();
        this.init();
        this.restore().then(() => {
            this._ready$.next(true);
        });
    }

    get ready$(): Observable<boolean> {
        return this._ready$.asObservable();
    }

    get deviceToken(): string {
        return this._deviceToken$.getValue();
    }

    set deviceToken(value: string) {
        this._deviceToken$.next(value);
    }

    get serverAddress$(): Observable<string> {
        return this._serverAddress$.asObservable();
    }

    get serverAddress(): string {
        return this._serverAddress$.getValue();
    }

    set serverAddress(value: string) {
        this._serverAddress$.next(value);
    }
        
    get searchInterval$(): Observable<number> {
        return this._searchInterval$.asObservable();
    }

    get searchInterval(): number {
        return this._searchInterval$.getValue();
    }

    set searchInterval(value: number) {
        this._searchInterval$.next(value);
    }
    
    get searchApi(): string {
        return this._searchApi$.getValue();
    }

    set searchApi(value: string) {
        this._searchApi$.next(value);
    }
}