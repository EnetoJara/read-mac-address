import { ExecException, execFile } from 'child_process';

const regexRegex = /[-\/\\^$*+?.()|[\]{}]/g;

export function unix(iface: string, callback: (err?: ExecException, out?:string)=>void) {
    execFile("ifconfig", [iface], function (err, out) {
        if (err) {
            callback(err);
            return;
        }
        var match = /[a-f0-9]{2}(:[a-f0-9]{2}){5}/.exec(out.toLowerCase());
        if (!match) {
            callback(new Error("did not find a mac address"));
            return;
        }
        callback(undefined, match[0].toLowerCase());
    });
}
