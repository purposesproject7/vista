// src/features/admin/components/broadcasts/BroadcastForm.jsx
import React from "react";
import { MegaphoneIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Card from "../../../../shared/components/Card";
import Button from "../../../../shared/components/Button";
import Input from "../../../../shared/components/Input";
import DateTimePicker from "../../../../shared/components/DateTimePicker";
import AudienceSelector from "./AudienceSelector";

const BroadcastForm = ({
  formData,
  editingBroadcastId,
  sending,
  onSubmit,
  onInputChange,
  onToggleAudience,
  onResetAudience,
  onCancelEdit,
  onRefreshHistory,
  historyLoading,
  schoolOptions,
  programOptions,
}) => {
  return (
    <Card className="mb-8">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingBroadcastId ? "Edit Broadcast" : "Create Broadcast"}
          </h2>
          <Button
            variant="secondary"
            onClick={onRefreshHistory}
            disabled={historyLoading}
          >
            Refresh History
          </Button>
        </div>

        {editingBroadcastId && (
          <div className="mb-6 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <span className="text-sm text-amber-700">
              Updating an existing broadcast. Changes will overwrite the
              original message.
            </span>
            <Button variant="secondary" size="sm" onClick={onCancelEdit}>
              <XMarkIcon className="h-4 w-4 mr-1" />
              Cancel edit
            </Button>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-gray-400">(optional)</span>
            </label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={onInputChange}
              placeholder="E.g. Upcoming Review Schedule"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={onInputChange}
              rows={4}
              required
              placeholder="Share the announcement that needs to reach faculty…"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-2 text-xs text-gray-500">
              Tip: Mention exact actions, timelines, or attachments if
              applicable.
            </p>
          </div>

          {/* Audience Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AudienceSelector
              label="Target Schools"
              options={schoolOptions}
              selected={formData.targetSchools}
              onToggle={(value) => onToggleAudience("targetSchools", value)}
              onReset={() => onResetAudience("targetSchools")}
            />
            <AudienceSelector
              label="Target Programs"
              options={programOptions}
              selected={formData.targetPrograms}
              onToggle={(value) => onToggleAudience("targetPrograms", value)}
              onReset={() => onResetAudience("targetPrograms")}
            />
          </div>

          {/* Expiry */}
          <DateTimePicker
            label="Expiry"
            value={formData.expiresAt}
            onChange={(isoString) => {
              onInputChange({
                target: { name: "expiresAt", value: isoString },
              });
            }}
            placeholder="Select expiry date and time"
            required={true}
            timeFormat="12"
          />

          {/* Action */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <div className="flex gap-4">
              <label
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer ${formData.action === "notice"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white"
                  }`}
              >
                <input
                  type="radio"
                  name="action"
                  value="notice"
                  checked={formData.action === "notice"}
                  onChange={onInputChange}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">
                  Notice (informational)
                </span>
              </label>
              <label
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer ${formData.action === "block"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 bg-white"
                  }`}
              >
                <input
                  type="radio"
                  name="action"
                  value="block"
                  checked={formData.action === "block"}
                  onChange={onInputChange}
                  className="text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium">
                  Block faculty access
                </span>
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Choose 'Block faculty access' to temporarily prevent faculty from
              using the portal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="broadcast-active"
              name="isActive"
              checked={formData.isActive}
              onChange={onInputChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="broadcast-active"
              className="text-sm font-medium text-gray-700"
            >
              Keep this broadcast active until expiry
            </label>
          </div>

          {/* Email Broadcast Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="broadcast-email"
              name="sendEmail"
              checked={formData.sendEmail || false}
              onChange={onInputChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="broadcast-email"
              className="text-sm font-medium text-gray-700"
            >
              Send as email to selected audience
            </label>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <Button type="submit" disabled={sending}>
              <MegaphoneIcon className="h-5 w-5 mr-2" />
              {sending
                ? editingBroadcastId
                  ? "Saving..."
                  : "Sending..."
                : editingBroadcastId
                  ? "Update Broadcast"
                  : "Send Broadcast"}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};

export default BroadcastForm;
