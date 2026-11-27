import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import * as cache from "@actions/cache";
import * as core from "@actions/core";
import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";
import { hashFile } from 'hasha';
<<<<<<< 1666d820cc8619bcd570fe15f9acbdfdfe726689
import axios, {isAxiosError} from 'axios'


const ThrottlingOctokit = Octokit.plugin(throttling) as typeof Octokit;
const SUPPORTED_TAR_EXTENSIONS = [".tar.gz", ".tar.xz", ".tar.bz2", ".tgz"];

// Add path validation
function validatePath(inputPath: string): string {
    const normalized = path.normalize(inputPath);
    if (normalized.includes('..') || path.isAbsolute(normalized)) {
        throw new Error('Invalid path: path traversal detected');
    }
    return normalized;
}

// Validate chmod format
function validateChmod(chmod: string): string {
    if (!/^[0-7]{3,4}$/.test(chmod)) {
        throw new Error('Invalid chmod format');
    }
    return chmod;
}

interface ToolInfo {
    owner: string;
    assetName: string;
    repoName: string;
    tag: string;
    osPlatform: string;
    osArch: string;
}
=======
import {
    cachePrimaryKey,
    downloadReleaseAsset,
    findMatchingAsset,
    getExtensionMatchRegexForm,
    getExtractFlags,
    getExtractFn,
    getOutputPath,
    getRelease,
    installExtractedFiles,
    moveDownloadedFile,
    resolveArch,
    resolvePlatform,
    resolveToken,
    toolPath,
    type ToolInfo,
    verifyDigest
} from "./install.js";

const ThrottlingOctokit = Octokit.plugin(throttling) as typeof Octokit;
>>>>>>> e3bac824540dae53cdf68bc5dd49ccbd9116d484

async function validateSubscription(): Promise<void> {
  const eventPath = process.env.GITHUB_EVENT_PATH
  let repoPrivate: boolean | undefined

  if (eventPath && fs.existsSync(eventPath)) {
    const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'))
    repoPrivate = eventData?.repository?.private
  }

  const upstream = 'jaxxstorm/action-install-gh-release'
  const action = process.env.GITHUB_ACTION_REPOSITORY
  const docsUrl =
    'https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions'

  core.info('')
  core.info('\u001b[1;36mStepSecurity Maintained Action\u001b[0m')
  core.info(`Secure drop-in replacement for ${upstream}`)
  if (repoPrivate === false)
    core.info('\u001b[32m\u2713 Free for public repositories\u001b[0m')
  core.info(`\u001b[36mLearn more:\u001b[0m ${docsUrl}`)
  core.info('')

  if (repoPrivate === false) return

  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com'
  const body: Record<string, string> = {action: action || ''}
  if (serverUrl !== 'https://github.com') body.ghes_server = serverUrl
  try {
    await axios.post(
      `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/maintained-actions-subscription`,
      body,
      {timeout: 3000}
    )
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      core.error(
        `\u001b[1;31mThis action requires a StepSecurity subscription for private repositories.\u001b[0m`
      )
      core.error(
        `\u001b[31mLearn how to enable a subscription: ${docsUrl}\u001b[0m`
      )
      process.exit(1)
    }
    core.info('Timeout or API not reachable. Continuing to next step.')
  }
}

async function run() {
    try {
<<<<<<< 1666d820cc8619bcd570fe15f9acbdfdfe726689
        await validateSubscription();
        const token = process.env["GITHUB_TOKEN"] || core.getInput("token");
=======
        const token = resolveToken(core.getInput("token"), process.env["GITHUB_TOKEN"]);
>>>>>>> e3bac824540dae53cdf68bc5dd49ccbd9116d484
        const octokit = new ThrottlingOctokit({
            throttle: {
                onRateLimit: (retryAfter, options) => {
                    core.warning(`RateLimit detected for request ${options.method} ${options.url}.`);
                    core.info(`Retrying after ${retryAfter} seconds.`);
                    return true;
                },
                onSecondaryRateLimit: (retryAfter, options) => {
                    core.warning(`SecondaryRateLimit detected for request ${options.method} ${options.url}.`);
                    core.info(`Retrying after ${retryAfter} seconds.`);
                    return true;
                },
            },
            ...(token ? { auth: token } : {}),
            userAgent: "actions/github-action",
            baseUrl: process.env["GITHUB_API_URL"] || "https://api.github.com",
            request: { timeout: 5000 },
        });
        const repo = core.getInput("repo");
        if (!repo) {
            throw new Error("Repo was not specified");
        }
        let tag = core.getInput("tag");
        tag = !tag ? "latest" : tag;
        let prerelease = core.getInput("prerelease") === "true";
        const cacheEnabled = core.getInput("cache") === "enable" && tag !== "latest" && tag !== "";
        const [owner, repoName] = repo.split("/");
        let assetName = core.getInput("asset-name");
        const platformMatching = core.getInput("platform-matching") !== "disable";
        const archMatching = core.getInput("arch-matching") !== "disable";
        if (!platformMatching) {
            core.info("==> Platform matching disabled");
        }
        if (!archMatching) {
            core.info("==> Architecture matching disabled");
        }
        let osPlatform = resolvePlatform(core.getInput("platform"), os.platform());
        core.info(`==> System reported platform: ${os.platform()}`);
        core.info(`==> Using platform: ${osPlatform}`);
        const { osArch, osArchMatch } = resolveArch(core.getInput("arch"), os.arch());
        core.info(`==> System reported arch: ${os.arch()}`);
        core.info(`==> Using arch: ${osArch}`);
        const extMatching = core.getInput("extension-matching") === "enable";
        let extension = core.getInput("extension");
        let extMatchRegexForm = getExtensionMatchRegexForm(extMatching, extension);
        if (extMatching) {
            if (extension === "") {
                core.info(`==> Using default file extension matching: ${extMatchRegexForm}`);
            } else {
                core.info(`==> Using custom file extension matching: ${extMatchRegexForm}`);
            }
        } else {
            core.info("==> File extension matching disabled");
        }
        let renameTo = core.getInput("rename-to");
        if (renameTo !== "") {
            core.info(`==> Will rename downloaded release to ${renameTo}`);
        }
        let chmodTo = core.getInput("chmod");
        if (chmodTo !== "") {
            chmodTo = validateChmod(chmodTo);
            core.info(`==> Will chmod downloaded release asset to ${chmodTo}`);
        }
        let toolInfo: ToolInfo = {
            owner,
            repoName,
            assetName,
            tag,
            osArch,
            osPlatform,
            platformMatching,
            archMatching
        };
        let dest = toolPath(toolInfo, getCacheDirectory());
        let binariesLocation = core.getInput("binaries-location");
        let finalBinLocation = dest;
        if (binariesLocation !== "") {
            binariesLocation = validatePath(binariesLocation);
            core.info(`==> Given bin location: ${binariesLocation}`);
            finalBinLocation = path.join(dest, binariesLocation);
        }
        core.info(`==> Binaries will be located at: ${finalBinLocation}`);
        let cacheKey = cachePrimaryKey(toolInfo);
        if (cacheEnabled && cacheKey !== undefined) {
            let ok = await cache.restoreCache([dest], cacheKey);
            if (ok !== undefined) {
                core.info(`Found ${assetName} in the cache: ${dest}`);
                core.info(`Adding ${finalBinLocation} to the path`);
                core.addPath(finalBinLocation);
                return;
            }
        }
        let release = await getRelease(octokit.rest.repos, owner, repoName, tag, prerelease);
        if (!release) {
            throw new Error(`Could not find release for tag ${tag}${prerelease ? " with prerelease" : ""}.`);
        }
        let asset = findMatchingAsset(release, {
            assetName,
            osPlatform,
            osArchMatch,
            platformMatching,
            archMatching,
            extensionMatchRegexForm: extMatchRegexForm
        }, core);
        if (!asset) {
            const found = release.assets.map(f => f.name);
            throw new Error(`Could not find asset for ${tag}. Found: ${found}`);
        }
        const url = asset.url;
        core.info(`Downloading ${asset.name} from ${url}`);
        const binPath = await downloadReleaseAsset(asset, token);
        const digest = core.getInput("digest");
        if (digest !== "") {
            core.info(`==> Will verify the downloaded release asset ${asset.name} with digest ${digest}`);

            const computedDigest = await hashFile(binPath, {algorithm: "sha256"});
            verifyDigest(asset.name, digest, computedDigest);
        }
        const extractFn = getExtractFn(asset.name);
        if (extractFn !== undefined) {
            const extractFlags = getExtractFlags(asset.name);
            if (extractFlags !== undefined) {
                core.info(`Attempting to extract archive with custom flags ${extractFlags}`);
                await extractFn(binPath, dest, extractFlags);
            } else {
                await extractFn(binPath, dest);
            }
            core.info(`Automatically extracted release asset ${asset.name} to ${dest}`);
            const binFiles = installExtractedFiles(finalBinLocation);
            if (binFiles.length > 1 && renameTo !== "") {
                core.warning("rename-to parameter ignored when installing                 a release from an archive that contains multiple files.");
            }
            for (const finalBinPath of binFiles) {
                if (chmodTo !== "") {
                    try {
                        fs.chmodSync(finalBinPath, chmodTo);
                        core.info(`chmod'd ${finalBinPath} to ${chmodTo}`);
                    } catch (chmodErr) {
                        core.setFailed(`Failed to chmod ${finalBinPath} to ${chmodTo}: ${chmodErr}`);
                    }
                }
                core.info(`installed binary [${finalBinPath}] (present in PATH)`);
            }
        } else {
            core.info(`Release asset ${asset.name} did not have a recognised file extension, unable to automatically extract it`);
            try {
                fs.mkdirSync(dest, { recursive: true });
<<<<<<< 1666d820cc8619bcd570fe15f9acbdfdfe726689
                if (renameTo !== "") {
                    renameTo = validatePath(renameTo);
                }
                const outputPath = path.join(dest, renameTo !== "" ? renameTo : path.basename(binPath));
=======
                const outputPath = getOutputPath(dest, binPath, renameTo);
>>>>>>> e3bac824540dae53cdf68bc5dd49ccbd9116d484
                core.info(`Created output directory ${dest}`);
                const moveResult = moveDownloadedFile(fs, binPath, outputPath);
                if (moveResult.usedCopyFallback) {
                    core.debug(`Falling back to copy and remove, due to: ${moveResult.error}`);
                }
                const moveFailed = moveResult.moveFailed;
                if (moveFailed && moveResult.usedCopyFallback) {
                    core.setFailed(`Failed to copy and remove downloaded release asset ${asset.name} from ${binPath} to ${outputPath}: ${moveResult.error}`);
                } else if (moveFailed) {
                    core.setFailed(`Failed to move downloaded release asset ${asset.name} from ${binPath} to ${outputPath}: ${moveResult.error}`);
                }
                if (!moveFailed) {
                    core.info(`Moved release asset ${asset.name} to ${outputPath}`);
                }
                if (chmodTo !== "" && !moveFailed) {
                    try {
                        fs.chmodSync(outputPath, chmodTo);
                        core.info(`chmod'd ${outputPath} to ${chmodTo}`);
                    } catch (chmodErr) {
                        core.setFailed(`Failed to chmod ${outputPath} to ${chmodTo}: ${chmodErr}`);
                    }
                }
            } catch (err) {
                core.setFailed(`Failed to create required output directory ${dest}`);
            }
        }
        if (cacheEnabled && cacheKey !== undefined) {
            try {
                await cache.saveCache([dest], cacheKey);
            } catch (error) {
                const typedError = error as Error;
                if (typedError.name === cache.ValidationError.name) {
                    throw error;
                } else if (typedError.name === cache.ReserveCacheError.name) {
                    core.info(typedError.message);
                } else {
                    core.warning(typedError.message);
                }
            }
        }
        core.info(`Adding ${finalBinLocation} to the path`);
        core.addPath(finalBinLocation);
        core.info(`Successfully installed ${assetName}`);
        core.info(`Binaries available at ${finalBinLocation}`);
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        } else {
            core.setFailed("catastrophic failure, please file an issue");
        }
    }
}

function getCacheDirectory() {
    const cacheDirectory = process.env["RUNNER_TOOL_CACHE"] || "";
    if (cacheDirectory === "") {
        core.warning("Expected RUNNER_TOOL_CACHE to be defined");
    }
    return cacheDirectory;
}

run();
