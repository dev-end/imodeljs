/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/** @packageDocumentation
 * @module Rendering
 */

import {
  disposeArray,
  IDisposable,
} from "@bentley/bentleyjs-core";
import { Transform } from "@bentley/geometry-core";
import {
  ViewFlag,
  ViewFlags,
} from "@bentley/imodeljs-common";
import { IModelConnection } from "../IModelConnection";
import { RenderGraphic } from "./RenderGraphic";
import { FeatureSymbology } from "./FeatureSymbology";
import { RenderClipVolume } from "./RenderClipVolume";
import { RenderPlanarClassifier } from "./RenderPlanarClassifier";
import {
  RenderMemory,
  RenderTextureDrape,
} from "./RenderSystem";

/**
 * A node in a scene graph. The branch itself is not renderable. Instead it contains a list of RenderGraphics,
 * and a transform, symbology overrides, and clip volume which are to be applied when rendering them.
 * Branches can be nested to build an arbitrarily-complex scene graph.
 * @see [[RenderSystem.createBranch]]
 * @public
 */
export class GraphicBranch implements IDisposable /* , RenderMemory.Consumer */ {
  /** The child nodes of this branch */
  public readonly entries: RenderGraphic[] = [];
  /** If true, when the branch is disposed of, the RenderGraphics in its entries array will also be disposed */
  public readonly ownsEntries: boolean;
  public viewFlagOverrides = new ViewFlag.Overrides();
  /** Optional symbology overrides to be applied to all graphics in this branch */
  public symbologyOverrides?: FeatureSymbology.Overrides;
  /** Optional animation branch Id.
   * @internal
   */
  public animationId?: string;

  /** Constructor
   * @param ownsEntries If true, when this branch is [[dispose]]d, all of the [[RenderGraphic]]s it contains will also be disposed.
   */
  public constructor(ownsEntries: boolean = false) { this.ownsEntries = ownsEntries; }

  /** Add a graphic to this branch. */
  public add(graphic: RenderGraphic): void { this.entries.push(graphic); }
  /** @internal */
  public getViewFlags(flags: ViewFlags, out?: ViewFlags): ViewFlags { return this.viewFlagOverrides.apply(flags.clone(out)); }
  /** @internal */
  public setViewFlags(flags: ViewFlags): void { this.viewFlagOverrides.overrideAll(flags); }
  /** @internal */
  public setViewFlagOverrides(ovr: ViewFlag.Overrides): void { this.viewFlagOverrides.copyFrom(ovr); }

  public dispose() { this.clear(); }
  public get isEmpty(): boolean { return 0 === this.entries.length; }

  /** Empties the list of [[RenderGraphic]]s contained in this branch, and if the [[GraphicBranch.ownsEntries]] flag is set, also disposes of them. */
  public clear(): void {
    if (this.ownsEntries)
      disposeArray(this.entries);
    else
      this.entries.length = 0;
  }

  /** @internal */
  public collectStatistics(stats: RenderMemory.Statistics): void {
    for (const entry of this.entries)
      entry.collectStatistics(stats);
  }
}

/** Options passed to [[RenderSystem.createGraphicBranch]].
 * @internal
 */
export interface GraphicBranchOptions {
  clipVolume?: RenderClipVolume;
  classifierOrDrape?: RenderPlanarClassifier | RenderTextureDrape;
  iModel?: IModelConnection;
}

/** Clip/Transform for a branch that are varied over time.
 * @internal
 */
export class AnimationBranchState {
  public readonly omit?: boolean;
  public readonly transform?: Transform;
  public readonly clip?: RenderClipVolume;
  constructor(transform?: Transform, clip?: RenderClipVolume, omit?: boolean) { this.transform = transform; this.clip = clip; this.omit = omit; }
}

/** Mapping from node/branch IDs to animation branch state
 * @internal
 */
export type AnimationBranchStates = Map<string, AnimationBranchState>;
