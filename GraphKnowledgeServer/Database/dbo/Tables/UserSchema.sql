CREATE TABLE [dbo].[UserSchema] (
    [UserSchemaId] INT            IDENTITY (1, 1) NOT NULL,
    [SchemaName]   NVARCHAR (50)  NULL,
    [SchemaDesc]   NVARCHAR (200) NULL,
    [OwnerUserId]  INT            NULL,
    CONSTRAINT [PK_UserSchema] PRIMARY KEY CLUSTERED ([UserSchemaId] ASC),
    CONSTRAINT [FK_UserSchema_Users] FOREIGN KEY ([UserSchemaId]) REFERENCES [dbo].[Users] ([UserId])
);

