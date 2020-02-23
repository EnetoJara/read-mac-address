import { linux } from './linux';
import { unix } from './unix';
import { window } from './window';


export function getOs (os: NodeJS.Platform) {
    if (os === "win32") {
        return window

    }
    if (os === "linux") {
        return linux

    }
    if (os === "darwin") {
        return unix

    }
    if (os === "sunos") {
        return unix

    }
    if (os === "freebsd") {
        return unix

    }

    return unix
}
