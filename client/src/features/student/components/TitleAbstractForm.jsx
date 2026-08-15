import React, { useState } from "react";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";

const TITLE_MAX_LENGTH = 200;
const ABSTRACT_MIN_WORDS = 250;
const ABSTRACT_MAX_WORDS = 500;

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const TitleAbstractForm = ({ initialTitle = "", initialAbstract = "", onSubmit, submitting }) => {
  const [title, setTitle] = useState(initialTitle);
  const [abstract, setAbstract] = useState(initialAbstract);

  const abstractWords = wordCount(abstract);
  const abstractValid =
    abstractWords >= ABSTRACT_MIN_WORDS && abstractWords <= ABSTRACT_MAX_WORDS;
  const titleValid = title.trim().length > 0 && title.length <= TITLE_MAX_LENGTH;
  const canSubmit = titleValid && abstractValid && !submitting;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ title: title.trim(), abstract: abstract.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          label="Project Title"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX_LENGTH))}
          placeholder="Enter your project title"
        />
        <p
          className={`text-xs mt-1 ${
            title.length > TITLE_MAX_LENGTH ? "text-red-600" : "text-gray-500"
          }`}
        >
          {title.length} / {TITLE_MAX_LENGTH} characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Abstract
        </label>
        <textarea
          value={abstract}
          onChange={(e) => setAbstract(e.target.value)}
          placeholder="Describe your project (250-500 words)"
          rows={10}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className={`text-xs mt-1 ${abstractValid ? "text-green-600" : "text-gray-500"}`}>
          {abstractWords} / {ABSTRACT_MIN_WORDS}-{ABSTRACT_MAX_WORDS} words
        </p>
      </div>

      <Button type="submit" variant="primary" className="w-full" disabled={!canSubmit}>
        {submitting ? "Submitting..." : "Submit Title & Abstract"}
      </Button>
    </form>
  );
};

export default TitleAbstractForm;
