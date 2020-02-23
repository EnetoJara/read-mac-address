import { ExecException, execFile } from "child_process";

const regexRegex = /[-\/\\^$*+?.()|[\]{}]/g;

function escape (str: string) {
    return str.replace(regexRegex, '\\$&');
}

export function window (iface: string, callback: (err?: ExecException, out?:string)=>void) {
    execFile("ipconfig", ["/all"], function (err: ExecException, out: string) {
        if (err) {
            callback(err, null);
            return;
        }
        var match = new RegExp(escape(iface)).exec(out);
        if (!match) {
            callback(new Error("did not find interface in `ipconfig /all`"), null);
            return;
        }
        out = out.substring(match.index + iface.length);
        match = /[A-Fa-f0-9]{2}(\-[A-Fa-f0-9]{2}){5}/.exec(out);
        if (!match) {
            callback(new Error("did not find a mac address"), null);
            return;
        }
        callback(null, match[0].toLowerCase().replace(/\-/g, ':'));
    });
}
