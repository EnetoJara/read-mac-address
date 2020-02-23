import { ExecException, execFile } from 'child_process';

export function linux (iface: string, callback: (err?: ExecException, out?:string)=>void) {
    return new Promise((resolve, reject) => {
        execFile("cat", ["/sys/class/net/" + iface + "/address"], function (err, out) {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, out.trim().toLowerCase());
        });
    })
}
