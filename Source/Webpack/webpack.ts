/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Dolittle. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Configuration } from "webpack";
import { WebpackConfiguration } from "./WebpackConfiguration";

export function webpack(dirname: string, settingsCallback?: (config: Configuration) => void) {
  return () => {
    let config = new WebpackConfiguration(dirname, process.env, process.argv).createConfiguration();
    if (typeof settingsCallback === "function") settingsCallback(config);
    return config;
  };
}