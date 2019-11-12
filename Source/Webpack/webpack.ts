/*---------------------------------------------------------------------------------------------
*  Copyright (c) Dolittle. All rights reserved.
*  Licensed under the MIT License. See LICENSE in the project root for license information.
*--------------------------------------------------------------------------------------------*/
import { WebpackConfiguration } from "./WebpackConfiguration";
import { WebpackEnvironment } from "./WebpackEnvironment"; 


export function webpack(dirname: string, settingsCallback: (config: WebpackConfiguration) => void) {
    return (env: WebpackEnvironment) => {
        let config = new WebpackConfiguration(dirname, env);
        settingsCallback(config);
        return config;
    }
}