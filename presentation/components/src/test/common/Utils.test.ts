/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
/* tslint:disable:no-direct-imports */

import { expect } from "chai";
import * as faker from "faker";
import * as React from "react";
import {
  createRandomDescriptor, createRandomPropertiesField, createRandomNestedContentField,
  createRandomLabelDefinition, createRandomLabelCompositeValue,
} from "@bentley/presentation-common/lib/test/_helpers/random";
import { applyOptionalPrefix } from "../../common/ContentBuilder";
import * as utils from "../../common/Utils";
import { PrimitiveValue, Primitives } from "@bentley/imodeljs-frontend";
import { LabelCompositeValue } from "@bentley/presentation-common";

class TestComponent extends React.Component {
}

describe("Utils", () => {

  describe("priorityAndNameSortFunction", () => {

    it("sorts by priority and name", () => {
      const arr = [
        { priority: 2, name: "d" },
        { priority: 3, name: "c" },
        { priority: 3, name: "b" },
        { priority: 1, name: "a" },
      ];
      arr.sort(utils.priorityAndNameSortFunction);
      expect(arr).to.deep.eq([
        { priority: 3, name: "b" },
        { priority: 3, name: "c" },
        { priority: 2, name: "d" },
        { priority: 1, name: "a" },
      ]);
    });

  });

  describe("getDisplayName", () => {

    beforeEach(() => {
      (TestComponent as any).displayName = undefined;
      Object.defineProperty(TestComponent, "name", { value: undefined });
    });

    it("returns displayName property value, if set", () => {
      const displayName = faker.random.word();
      (TestComponent as any).displayName = displayName;
      expect(utils.getDisplayName(TestComponent)).to.eq(displayName);
    });

    it("returns name property value, if set", () => {
      const displayName = faker.random.word();
      Object.defineProperty(TestComponent, "name", { value: displayName });
      expect(utils.getDisplayName(TestComponent)).to.eq(displayName);
    });

    it("returns 'Component' if neither displayName nor name properties are set", () => {
      expect(utils.getDisplayName(TestComponent)).to.eq("Component");
    });

  });

  describe("findField", () => {

    it("returns undefined for invalid name", () => {
      const descriptor = createRandomDescriptor();
      const result = utils.findField(descriptor, "doesn't exist");
      expect(result).to.be.undefined;
    });

    it("returns undefined for invalid name when there are nested fields", () => {
      const nestedField = createRandomPropertiesField();
      const nestingField = createRandomNestedContentField([nestedField]);
      const descriptor = createRandomDescriptor();
      descriptor.fields = [nestingField];
      const result = utils.findField(descriptor, applyOptionalPrefix(nestedField.name, "doesn't exist"));
      expect(result).to.be.undefined;
    });

    it("finds field in Descriptor.fields list", () => {
      const descriptor = createRandomDescriptor();
      const field = descriptor.fields[0];
      const result = utils.findField(descriptor, field.name);
      expect(result).to.eq(field);
    });

    it("finds nested field", () => {
      const nestedField = createRandomPropertiesField();
      const nestingField = createRandomNestedContentField([nestedField]);
      const descriptor = createRandomDescriptor();
      descriptor.fields = [nestingField];
      const result = utils.findField(descriptor, applyOptionalPrefix(nestedField.name, nestingField.name));
      expect(result).to.eq(nestedField);
    });

  });

  describe("createLabelRecord", () => {
    const validateCompositeValue = (actual: Primitives.Composite, expected: LabelCompositeValue) => {
      expect(actual.separator).to.be.eq(expected.separator);
      expect(actual.parts.length).to.be.eq(expected.values.length);
      for (let i = 0; i < actual.parts.length; i++) {
        expect(actual.parts[i].displayValue).to.be.eq(expected.values[i].displayValue);
        expect(actual.parts[i].rawValue).to.be.eq(expected.values[i].rawValue);
        expect(actual.parts[i].typeName).to.be.eq(expected.values[i].typeName);
      }
    };

    it("creates PropertyRecord for label with simple value", () => {
      const definition = createRandomLabelDefinition();
      const record = utils.createLabelRecord(definition, "test");
      const primitiveValue = record.value as PrimitiveValue;
      expect(primitiveValue.value).to.be.eq(definition.rawValue);
      expect(primitiveValue.displayValue).to.be.eq(definition.displayValue);
      expect(record.property.typename).to.be.eq(definition.typeName);
    });

    it("creates PropertyRecord for label with composite value", () => {
      const compositeValue = createRandomLabelCompositeValue();
      const definition = { ...createRandomLabelDefinition(), rawValue: compositeValue, typeName: "composite" };
      const record = utils.createLabelRecord(definition, "test");
      const primitiveValue = record.value as PrimitiveValue;
      validateCompositeValue(primitiveValue.value as Primitives.Composite, definition.rawValue);
      expect(primitiveValue.displayValue).to.be.eq(definition.displayValue);
      expect(record.property.typename).to.be.eq(definition.typeName);
    });

  });

});
