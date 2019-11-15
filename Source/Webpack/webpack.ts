/*---------------------------------------------------------------------------------------------
*  Copyright (c) Dolittle. All rights reserved.
*  Licensed under the MIT License. See LICENSE in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { Configuration } from "webpack";
import { WebpackConfiguration } from "./WebpackConfiguration";
import { WebpackEnvironment } from "./WebpackEnvironment"; 
import { WebpackArguments } from "./WebpackArguments";

export function webpack(dirname: string, settingsCallback?: (config: Configuration) => void) {
    return (env: WebpackEnvironment = {}, argv: WebpackArguments = {}) => {
        let config = new WebpackConfiguration(dirname, env, argv).createConfiguration();
        if (typeof settingsCallback === 'function') settingsCallback(config);
        return (config);
    }
}
