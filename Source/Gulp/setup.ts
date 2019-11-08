/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Dolittle. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { GulpContext, getGulpTasks as getGulpTasksForNode} from '@dolittle/typescript.build.node';
/**
 * Setup the tasks from this package
 * @param {any} originalExports The original exports object in the scope of the gulpfile importing this
 */
export default function setupGulp(originalExports: any) {
    let context = new GulpContext();
    let gulpTasksForNode = getGulpTasksForNode(context);
    for (let task of gulpTasksForNode.allTasks ) {
        if (task.displayName === undefined) throw new Error('Task missing displayName!');
        originalExports[task.displayName] = task;
    }

    originalExports['build'] = undefined;
    
    originalExports.default = (done: (error?: Error) => void) => {
        console.info('There is no default task');
        done();
        process.exit(0);
    }
}
