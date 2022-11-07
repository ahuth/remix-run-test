import { json, redirect, type ActionFunction, type LoaderFunction } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useTransition } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getPost, updatePost, type Post } from "~/models/post.server";

const inputClassName = `w-full rounded border border-gray-500 px-2 py-1 text-lg`;

type LoaderData = { post: Post };

type ActionData =
  | {
    title: null | string;
    slug: null | string;
    markdown: null | string;
  }
  | undefined;

export const loader: LoaderFunction = async ({ params }) => {
  invariant(params.slug, `params.slug is required`);

  const post = await getPost(params.slug);
  invariant(post, `Post not found: ${params.slug}`);

  return json<LoaderData>({ post });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  const title = formData.get("title");
  const slug = formData.get("slug");
  const markdown = formData.get("markdown");

  const errors: ActionData = {
    title: title ? null : "Title is required",
    slug: slug ? null : "Slug is required",
    markdown: markdown ? null : "Markdown is required",
  };

  const hasErrors = Object.values(errors).some(
    (errorMessage) => errorMessage
  );

  if (hasErrors) {
    return json<ActionData>(errors);
  }

  invariant(typeof title === "string", "title must be a string");
  invariant(typeof slug === "string", "slug must be a string");
  invariant(typeof markdown === "string", "markdown must be a string");

  // TODO: remove me
  // For testing purposes.
  await new Promise((res) => setTimeout(res, 1000));

  await updatePost({ title, slug, markdown });

  return redirect(`/posts/admin/${slug}`);
};

export default function NewPost() {
  const { post } = useLoaderData<LoaderData>();
  const errors = useActionData();
  const transition = useTransition();
  const isUpdating = Boolean(transition.submission);

  return (
    <Form method="put">
      <p>
        <label>
          Post Title:{" "}
          {errors?.title ? <em className="text-red-600">{errors.title}</em> : null}
          <input
            type="text"
            name="title"
            className={inputClassName}
            defaultValue={post.title}
            // Using key to force a re-render when we change routes and are editing a different post,
            // so that we pre-fill the fields correctly. Is there a better way to do this?
            key={post.title}
          />
        </label>
      </p>
      <p>
        <label>
          Post Slug:{" "}
          {errors?.slug ? <em className="text-red-600">{errors.slug}</em> : null}
          <input
            type="text"
            name="slug"
            className={inputClassName}
            defaultValue={post.slug}
            // Using key to force a re-render when we change routes and are editing a different post,
            // so that we pre-fill the fields correctly. Is there a better way to do this?
            key={post.slug}
          />
        </label>
      </p>
      <p>
        <label htmlFor="markdown">
          Markdown:{" "}
          {errors?.markdown ? (
            <em className="text-red-600">
              {errors.markdown}
            </em>
          ) : null}
        </label>
        <br />
        <textarea
          id="markdown"
          rows={20}
          name="markdown"
          className={`${inputClassName} font-mono`}
          defaultValue={post.markdown}
          // Using key to force a re-render when we change routes and are editing a different post,
          // so that we pre-fill the fields correctly. Is there a better way to do this?
          key={post.markdown}
        />
      </p>
      <p className="text-right">
        <button
          type="submit"
          className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
          disabled={isUpdating}
        >
          {isUpdating ? "Updating..." : "Update Post"}
        </button>
      </p>
    </Form>
  );
}
