import React from "react";

const DataDeletion = () => {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Data Deletion / GDPR</h1>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        Use this page to request account deletion and data export. The actual
        deletion endpoint will require you to be authenticated. This page is a
        UI placeholder; backend endpoints are provided under /api/auth.
      </p>

      <section className="mt-6">
        <h2 className="text-lg font-medium">Delete my account</h2>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          When you confirm deletion, your account and associated data will be
          removed from our servers. This action is permanent.
        </p>
        <div className="mt-4">
          <button
            type="button"
            className="px-4 py-2 bg-red-600 text-white rounded"
            onClick={() =>
              alert("This will call /api/auth/account (DELETE) when wired up.")
            }
          >
            Request account deletion
          </button>
        </div>
      </section>
    </div>
  );
};

export default DataDeletion;
