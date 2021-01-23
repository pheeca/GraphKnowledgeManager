CREATE TABLE [dbo].[SchemaInformation] (
    [Id]           BIGINT         IDENTITY (1, 1) NOT NULL,
    [SchemaInfo]   NVARCHAR (MAX) NULL,
    [CreationDate] DATETIME       NULL,
    [UserSchemaId] INT            NOT NULL,
    [ModifiedBy]   INT            NULL,
    [Status]       NVARCHAR (10)  NULL,
    CONSTRAINT [PK_SchemInfo] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_SchemaInformation_UserSchema] FOREIGN KEY ([UserSchemaId]) REFERENCES [dbo].[UserSchema] ([UserSchemaId])
);





