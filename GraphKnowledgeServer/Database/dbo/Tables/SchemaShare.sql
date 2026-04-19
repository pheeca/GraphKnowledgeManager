CREATE TABLE [dbo].[SchemaShare] (
    [ShareId]       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [UserSchemaId]  INT              NOT NULL,
    [RootNodeId]    INT              NOT NULL,
    [AccessMode]    NVARCHAR (20)    NOT NULL DEFAULT 'ReadOnly',
    [CreatedBy]     INT              NOT NULL,
    [CreatedAt]     DATETIME         NOT NULL DEFAULT GETUTCDATE(),
    [ExpiresAt]     DATETIME         NULL,
    [IsRevoked]     BIT              NOT NULL DEFAULT 0,
    CONSTRAINT [PK_SchemaShare] PRIMARY KEY CLUSTERED ([ShareId] ASC),
    CONSTRAINT [FK_SchemaShare_UserSchema] FOREIGN KEY ([UserSchemaId]) REFERENCES [dbo].[UserSchema] ([UserSchemaId]),
    CONSTRAINT [FK_SchemaShare_Users] FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Users] ([UserId]),
    CONSTRAINT [CK_SchemaShare_AccessMode] CHECK ([AccessMode] IN ('ReadOnly', 'ReadWrite'))
);
