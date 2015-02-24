# api v0.0.0




- [Share](#share)
	- [Get list of contexts](#get-list-of-contexts)
	- [Get list of associated students](#get-list-of-associated-students)
	- [Publish Share](#publish-share)



# Share

## Get list of contexts

<p>Retrieve the list of contexts this sharehas been sent to, intersected with the list of contextsthat the requesting user belongs to.</p>

	GET /share/:id/contexts

### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| id			| String			|  <p>unique id of the share</p>							|

## Get list of associated students

<p>Retrieve the list of students who have access to thisshare in the contexts specified by <code>context</code></p>

	GET /share/:id/members

### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| id			| String			|  <p>unique id of the share to be published</p>							|
| context			| [String]			|  <p>List of contexts ids (a single context may also be passed)</p>							|

## Publish Share

<p>Publish the share referenced by <code>id</code></p>

	PUT /share/:id/published

### Parameters

| Name    | Type      | Description                          |
|---------|-----------|--------------------------------------|
| id			| String			|  <p>unique id of the share to be published</p>							|


